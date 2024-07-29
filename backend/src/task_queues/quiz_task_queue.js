import { Worker, Queue } from "bullmq";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import Groq from "groq-sdk";
import { config } from "dotenv";
import { sequelize } from "../datasource.js";
import fs from "fs";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";

config();

ffmpeg.setFfmpegPath(ffmpegStatic);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

try {
  await sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export const quizJobQueue = new Queue("quizJobQueue", {
  connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

async function transcriptGPT(fileContent) {
  const prompt = `
  Generate a 4 choice quiz with the answer after each question along with
  timestamp (minutes:seconds) that reveals the answer based on the
  transcript below. Follow this sample format:
  **title for quiz**

  **question**
  **choice a**
  **choice b**
  **choice c**
  **choice d**
  **answer**
  **timestamp**

  **question**...

  An example of a quiz with 2 questions would be
  (including asterisks for formatting purposes):
  **Sample Quiz**

  **Question 1** What is the capital of France?
  **Choice A** Berlin
  **Choice B** Madrid
  **Choice C** Paris
  **Choice D** Rome
  **Answer** C) Paris
  **Timestamp** 10:23

  **Question 2** What is the capital of Germany?
  **Choice A** Berlin
  **Choice B** Madrid
  **Choice C** Paris
  **Choice D** Rome
  **Answer** A) Berlin
  **Timestamp** 51:10
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
- First line of every response is title
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
      if (!lines[i].includes("**")) {
        index--;
        continue;
      }

      temp = lines[i];

      if (questionPattern.test(temp)) {
        question.text = temp
          .split(questionPattern)[1]
          .replaceAll("**", "")
          .trim();
      } else if (choicePattern.test(temp)) {
        const choice = temp.split(choicePattern)[1].replaceAll("**", "").trim();
        question.options.push(choice);
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
          const string = pattern.exec(temp);
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
    response_format: "verbose_json",
    language: "en",
    temperature: 0.0,
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

  await Promise.all(questionPromises).catch((error) => {
    if (error) return null;
  });

  return quiz;
}

async function onQuizFromVideo(job) {
  const { filename, uploadDir, id } = job.data;

  const audioFilePath = "assets/output.mp3";
  await new Promise((resolve, reject) => {
    ffmpeg(uploadDir + filename)
      .output(audioFilePath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  job.updateProgress(25);

  const transcript = await transcribeAudio(audioFilePath);
  job.updateProgress(50);

  const response = await transcriptGPT(transcript);
  job.updateProgress(75);

  const { title, questions } = extractQuestions(response);
  const quiz = await createQuiz(id, title, filename, questions);
  job.updateProgress(100);

  return quiz;
}

async function onQuizFromAudio(job) {
  const { filename, uploadDir, id } = job.data;
  job.updateProgress(25);
  const transcript = await transcribeAudio(uploadDir + filename);
  job.updateProgress(50);

  const response = await transcriptGPT(transcript);
  job.updateProgress(75);

  const { title, questions } = extractQuestions(response);
  const quiz = await createQuiz(id, title, filename, questions);
  job.updateProgress(100);

  return quiz;
}

async function onQuizFromTranscript(job) {
  const { filename, uploadDir, id } = job.data;
  job.updateProgress(25);
  const fileContent = fs.readFileSync(uploadDir + filename, "utf8");
  job.updateProgress(50);

  const response = await transcriptGPT(fileContent);
  job.updateProgress(75);

  const { title, questions } = extractQuestions(response);
  const quiz = await createQuiz(id, title, filename, questions);
  job.updateProgress(100);

  return quiz;
}

const jobsHandlers = {
  quizFromVideo: onQuizFromVideo,
  quizFromAudio: onQuizFromAudio,
  quizFromTranscript: onQuizFromTranscript,
};

const quizWorker = new Worker(
  "quizJobQueue",
  async (job) => {
    const handler = jobsHandlers[job.name];
    if (handler) {
      return handler(job);
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },
);

quizWorker.on("completed", (job) => {
  console.log(`Job with ID ${job.id} has been completed`);
});

quizWorker.on("failed", async (job, err) => {
  console.log(`Job with ID ${job.id} has failed with error: ${err.message}`);
  await job.remove();
});
