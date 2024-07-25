import { Worker } from "bullmq";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import Groq from "groq-sdk";
import { config } from "dotenv";
import { sequelize } from "../datasource.js";
import fs from "fs";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { Queue } from "bullmq";

config();

ffmpeg.setFfmpegPath(ffmpegStatic);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

try {
  await sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

async function transcriptGPT(fileContent) {
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

  return chatCompletion.choices[0]?.message?.content || "";
}

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

async function transcribeAudio(audioFile) {
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
}

async function createQuiz(id, title, filename, questions) {
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
    }),
  );

  //TODO: Unhandled promise rejection
  await Promise.all(questionPromises).catch((error) => {
    if (error) return null;
  });

  return quiz;
}

async function onQuizFromVideo(jobData) {
  const { filename, uploadDir, id } = jobData;

  const audioFilePath = "assets/output.mp3";
  await new Promise((resolve, reject) => {
    ffmpeg(uploadDir + filename)
      .output(audioFilePath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  const transcript = await transcribeAudio(audioFilePath);
  const response = await transcriptGPT(transcript);
  const { title, questions } = extractQuestions(response);
  return await createQuiz(id, title, filename, questions);
}

async function onQuizFromAudio(jobData) {
  const { filename, uploadDir, id } = jobData;
  const transcript = await transcribeAudio(uploadDir + filename);
  const response = await transcriptGPT(transcript);
  const { title, questions } = extractQuestions(response);
  return await createQuiz(id, title, filename, questions);
}

async function onQuizFromTranscript(jobData) {
  const { filename, uploadDir, id } = jobData;
  const fileContent = fs.readFileSync(uploadDir + filename, "utf8");
  const response = await transcriptGPT(fileContent);
  const { title, questions } = extractQuestions(response);
  return await createQuiz(id, title, filename, questions);
}

const jobsHandlers = {
  quizFromVideo: onQuizFromVideo,
  quizFromAudio: onQuizFromAudio,
  quizFromTranscript: onQuizFromTranscript,
};

export const quizJobQueue = new Queue("quizJobQueue", {
  connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

const quizWorker = new Worker(
  "quizJobQueue",
  async (job) => {
    console.log(`Processing job with ID ${job.id}`);
    const handler = jobsHandlers[job.name];
    if (handler) {
      return handler(job.data);
    }
  },
  {
    connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
  },
);

quizWorker.on("completed", (job) => {
  console.log(`Job with ID ${job.id} has been completed`);
});

quizWorker.on("failed", (job, err) => {
  console.log(`Job with ID ${job.id} has failed with error: ${err.message}`);
});
