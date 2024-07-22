import { Router } from "express";
import { User } from "../models/users.js";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { body, validationResult } from "express-validator";
import { config } from "dotenv";
import Groq from "groq-sdk";
import multer from "multer";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { mkdirSync, existsSync } from "fs";
import { ensureAuthenticated } from "../middlewares/auth.js";

// Ensure upload directory exists
const uploadDir = "uploads/";
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

ffmpeg.setFfmpegPath(ffmpegStatic);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const fileExt = file.originalname.split(".").pop();
    const filename = `${new Date().getTime()}.${fileExt}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const quizzesRouter = Router();

const transcriptGPT = async (fileContent) => {
  const prompt = `Generate a 4 choice quiz with the answer after each question along with timestamp that reveals the answer based on the transcript below. Follow this sample format:
                    **title for quiz**

                    **question**
                    **choice a**
                    **choice b**
                    **choice c**
                    **choice d**
                    **answer**
                    **timestamp**

                    **question**...

                    An example of a quiz would be:
                    **Sample Quiz**

                    **Question 1**
                    What is the capital of France?
                    **Choice A** Berlin
                    **Choice B** Madrid
                    **Choice C** Paris
                    **Choice D** Rome
                    **Answer** C) Paris
                    **Timestamp** 0:00
                    `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt + fileContent,
      },
    ],
    temperature: 0,
    model: "llama3-8b-8192",
  });

  const response = chatCompletion.choices[0]?.message?.content || "";

  if (response === "") {
    return res.status(500).json({ error: "No response from GROQ" });
  }

  return response;
};

/* Assumptions:
  - First line of every resposne is title
  - Every question has at least a question, 4 choices, 
    an answer, and timestamp, in that order with each occupying 1 or 2 lines
  - ** is used to indicate the start of a question, choice, answer, or 
    timestamp
  - If correct answer cannot be extracted, first choice is assumed to be
    correct
*/
const extractQuestions = (response) => {
  const lines = response.split("\n");
  const title = lines[0].replaceAll("**", "").trim();
  const questions = [];
  let index = 0;
  let question = { text: "", options: [], answer: "", timestamp: 0 };

  const questionPattern = /^\*\*\s*question\s*[0-9]*\)?:?/i;
  const choicePattern = /^\*\*\s*choice\s*[abcd]\)?:?\s*\*\*/i;
  const answerPatterns = [
    /^\*\*\s*answer\s*:?\)?\s*\*\*\s*[abcd]\)?:?/i,
    /^\*\*\s*answer\s*[abcd]\)?:?\s*\*\*/i,
    /\*\*\s*choice\s*[abcd]\)?:?\s*\*\*/i,
  ];
  const timestampPattern = /^\*\*\s*timestamp/i;
  const choices = ["a", "b", "c", "d"];

  for (let i = 1; i < lines.length; i++) {
    let temp = "";
    if (!lines[i].includes("**")) continue;
    index = 0;
    for (index; i < lines.length && index < 7; i++, index++) {
      temp = lines[i];
      if (
        i + 1 < lines.length &&
        !lines[i + 1].includes("**") &&
        (index !== 0 || lines[i + 1].includes("?"))
      ) {
        temp += " " + lines[i + 1];
        i++;
      }

      if (questionPattern.test(temp)) {
        question.text = temp
          .split(questionPattern)[1]
          .replaceAll("**", "")
          .trim();
      } else if (choicePattern.test(temp)) {
        question.options.push(temp.replaceAll("**", "").trim());
      } else if (timestampPattern.test(temp)) {
        const timeInSeconds = /\d+.\d\d/.exec(temp);
        const timeInMinutes = /\d+:\d\d/.exec(temp);
        if (timeInSeconds !== null) {
          question.timestamp = 1000 * parseInt(timeInSeconds[0].split(".")[0]);
        } else if (timeInMinutes !== null) {
          const [minutes, seconds] = timeInMinutes[0].split(":");
          question.timestamp =
            (parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
        }
      } else {
        answerPatterns.map((pattern) => {
          let string = pattern.exec(temp);
          if (string !== null) {
            question.answer = string[0].split(" ")[1];
          }
        });
      }
    }

    if (index >= 7) {
      choices.map((choice) => {
        if (question.answer.toLowerCase().includes(choice)) {
          question.answer = "option" + (choices.indexOf(choice) + 1);
        }
      });
      questions.push(question);
      question = { text: "", options: [], answer: "", timestamp: 0 };
    }
  }
  return { title, questions };
};

const transcribeAudio = async (audioFile) => {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioFile),
    model: "whisper-large-v3",
    response_format: "verbose_json", // Optional
    language: "en", // Optional
    temperature: 0.0, // Optional
  });

  const content = transcription.segments
    .map((segment) => "(" + segment.start + ")\n" + segment.text + "\n\n")
    .join("");
  return content;
};

const createQuiz = async (id, title, filename, questions) => {
  const quiz = await Quiz.create({ title, filename, UserId: id });

  const questionPromises = questions.map((question) =>
    Question.create({
      QuizId: quiz.id,
      text: question.text,
      option1: question.options[0],
      option2: question.options[1],
      option3: question.options[2],
      option4: question.options[3],
      correctAnswer: question.answer,
      timestamp: question.timestamp,
    })
  );

  //TODO: Unhandled promise rejection
  await Promise.all(questionPromises).catch((error) => {
    if (error) return null;
  });

  return quiz;
};

quizzesRouter.post(
  "/:id/quizzes/text",
  upload.single("textFile"),
  async (req, res) => {
    const id = req.params.id;
    const textFile = req.file;

    const errors = validationResult(req);
    if (!errors.isEmpty() || !textFile) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const fileContent = fs.readFileSync(req.file.path, "utf8");
      const response = await transcriptGPT(fileContent);
      const { title, questions } = extractQuestions(response);
      const quiz = await createQuiz(id, title, textFile.filename, questions);
      if (quiz === null) {
        return res.status(500).json({ error: "Internal server error" });
      }

      return res
        .status(201)
        .json({ message: "Quiz created successfully", quiz });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

quizzesRouter.post(
  "/:id/quizzes/audio",
  upload.single("audioFile"),
  async (req, res) => {
    const id = req.params.id;
    const audioFile = req.file;

    const errors = validationResult(req);
    if (!errors.isEmpty() || !audioFile) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const transcript = await transcribeAudio(audioFile.path);
      const response = await transcriptGPT(transcript);
      const { title, questions } = extractQuestions(response);
      const quiz = await createQuiz(id, title, audioFile.filename, questions);
      if (quiz === null) {
        return res.status(500).json({ error: "Internal server error" });
      }

      return res
        .status(201)
        .json({ message: "Quiz created successfully", quiz });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

quizzesRouter.post(
  "/:id/quizzes/video",
  upload.single("videoFile"),
  async (req, res) => {
    const id = req.params.id;
    const videoFile = req.file;

    const errors = validationResult(req);
    if (!errors.isEmpty() || !videoFile) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const audioFilePath = "assets/output.mp3";
      await new Promise((resolve, reject) => {
        ffmpeg(videoFile.path)
          .output(audioFilePath)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });

      const transcript = await transcribeAudio(audioFilePath);
      const response = await transcriptGPT(transcript);
      const { title, questions } = extractQuestions(response);
      const quiz = await createQuiz(id, title, videoFile.filename, questions);
      if (quiz === null) {
        console.log("Quiz is null");
        return res.status(500).json({ error: "Internal server error" });
      }

      return res
        .status(201)
        .json({ message: "Quiz created successfully", quiz });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

quizzesRouter.get("/:id/quizzes", ensureAuthenticated, async (req, res) => {
  if (req.params.id === undefined || typeof +req.params.id !== "number") {
    return res.status(422).json({ error: "Invalid user ID" });
  }
  const user = await User.findByPk(req.params.id);
  if (user === null) {
    return res.status(404).json({ error: "User not found" });
  }
  if (req.session.username && req.session.username !== user.username) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (req.user && req.user.id !== user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const quizzes = await Quiz.findAll({ where: { UserId: req.params.id } });
  return res.json(quizzes);
});

quizzesRouter.get(
  "/:id/quizzes/:quizId",
  ensureAuthenticated,
  async (req, res) => {
    if (req.params.id === undefined || typeof +req.params.id !== "number") {
      return res.status(422).json({ error: "Invalid user ID" });
    }
    if (
      req.params.quizId === undefined ||
      typeof +req.params.quizId !== "number"
    ) {
      return res.status(422).json({ error: "Invalid quiz ID" });
    }
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.session.username && req.session.username !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.user && req.user.id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const quiz = await Quiz.findOne({
      where: { id: req.params.quizId, UserId: req.params.id },
    });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    // Include questions in the response
    const questions = await Question.findAll({ where: { QuizId: quiz.id } });
    return res.json({ quiz: quiz, questions: questions });
  }
);

quizzesRouter.get(
  "/:id/quizzes/:quizId/video",
  ensureAuthenticated,
  async (req, res) => {
    if (req.params.id === undefined || typeof +req.params.id !== "number") {
      return res.status(422).json({ error: "Invalid user ID" });
    }
    if (
      req.params.quizId === undefined ||
      typeof +req.params.quizId !== "number"
    ) {
      return res.status(422).json({ error: "Invalid quiz ID" });
    }
    const user = await User.findByPk(req.params.id);

    if (user === null) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.session.username && req.session.username !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.user && req.user.id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const quiz = await Quiz.findOne({
      where: { id: req.params.quizId, UserId: req.params.id },
    });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    const videoPath = `uploads/${quiz.filename}`;
    return res.sendFile(videoPath, { root: "." });
  }
);

quizzesRouter.delete(
  "/:id/quizzes/:quizId",
  ensureAuthenticated,
  async (req, res) => {
    if (req.params.id === undefined || typeof +req.params.id !== "number") {
      return res.status(422).json({ error: "Invalid user ID" });
    }
    if (
      req.params.quizId === undefined ||
      typeof +req.params.quizId !== "number"
    ) {
      return res.status(422).json({ error: "Invalid quiz ID" });
    }
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.session.username && req.session.username !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.user && req.user.id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const quiz = await Quiz.findOne({
      where: { id: req.params.quizId },
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    const questions = await Question.destroy({ where: { QuizId: quiz.id } });
    const quizDeleted = await Quiz.destroy({
      where: { id: req.params.quizId },
    });
    return res.json({ message: "Quiz deleted successfully" });
  }
);
