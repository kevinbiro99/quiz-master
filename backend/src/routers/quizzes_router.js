import { Router } from "express";
import { User } from "../models/users.js";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { validationResult } from "express-validator";
import { config } from "dotenv";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { mkdirSync, existsSync } from "fs";
import { ensureAuthenticated } from "../middlewares/auth.js";
import { quizJobQueue } from "../task_queues/quiz_task_queue.js";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "uploads/";
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

// Ensure assets directory exists
const assetsDir = "assets/";
if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir);
}

ffmpeg.setFfmpegPath(ffmpegStatic);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExt = file.originalname.split(".").pop();
    const filename = `${new Date().getTime()}.${fileExt}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  limits: { files: 1 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("audio") ||
      file.mimetype.startsWith("video") ||
      file.mimetype.startsWith("text")
    ) {
      return cb(null, true);
    }
    return cb(new Error("File is not text, video, or audio"));
  },
});

config();

export const quizzesRouter = Router();

quizzesRouter.post(
  "/:id/quizzes/text",
  ensureAuthenticated,
  upload.single("textFile"),
  async (req, res) => {
    if (req.params.id === undefined || typeof +req.params.id !== "number") {
      return res.status(422).json({ error: "Invalid user ID" });
    }
    if (
      req.file === undefined ||
      req.file === null ||
      !req.file.mimetype.startsWith("text")
    ) {
      return res.status(415).json({ error: "Invalid text file" });
    }
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.user && req.user.id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.session.username && req.session.username !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }
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

      const job = await quizJobQueue.add("quizFromTranscript", {
        filename: textFile.filename,
        uploadDir: uploadDir,
        id,
      });
      return res
        .status(202)
        .json({ message: "Quiz creation in progress", jobId: job.id });
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(422).json({ error: "User not found" });
      } else if (error.name === "SequelizeValidationError") {
        return res.status(422).json({
          error: "Invalid input parameters. Expected id and file",
        });
      } else {
        return res.status(400).json({ error: "Cannot create quiz" });
      }
    }
  },
);

quizzesRouter.post(
  "/:id/quizzes/audio",
  ensureAuthenticated,
  upload.single("audioFile"),
  async (req, res) => {
    if (req.params.id === undefined || typeof +req.params.id !== "number") {
      return res.status(422).json({ error: "Invalid user ID" });
    }
    if (
      req.file === undefined ||
      req.file === null ||
      req.file.mimetype.startsWith("audio") === false
    ) {
      return res.status(415).json({ error: "Invalid audio file" });
    }
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.user && req.user.id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.session.username && req.session.username !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }
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

      const job = await quizJobQueue.add("quizFromAudio", {
        filename: audioFile.filename,
        uploadDir: uploadDir,
        id,
      });
      return res
        .status(202)
        .json({ message: "Quiz creation in progress", jobId: job.id });
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(422).json({ error: "User not found" });
      } else if (error.name === "SequelizeValidationError") {
        return res.status(422).json({
          error: "Invalid input parameters. Expected id and file",
        });
      } else {
        return res.status(400).json({ error: "Cannot create quiz" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

quizzesRouter.post(
  "/:id/quizzes/video",
  upload.single("videoFile"),
  ensureAuthenticated,
  async (req, res) => {
    if (req.params.id === undefined || typeof +req.params.id !== "number") {
      return res.status(422).json({ error: "Invalid user ID" });
    }
    if (
      req.file === undefined ||
      req.file === null ||
      req.file.mimetype !== "video/mp4"
    ) {
      return res.status(415).json({ error: "Invalid video file" });
    }
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.user && req.user.id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.session.username && req.session.username !== user.username) {
      return res.status(403).json({ error: "Forbidden" });
    }
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

      const job = await quizJobQueue.add("quizFromVideo", {
        filename: videoFile.filename,
        uploadDir: uploadDir,
        id,
      });
      return res
        .status(202)
        .json({ message: "Quiz creation in progress", jobId: job.id });
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(422).json({ error: "User not found" });
      } else if (error.name === "SequelizeValidationError") {
        return res.status(422).json({
          error: "Invalid input parameters. Expected id and file",
        });
      } else {
        return res.status(400).json({ error: "Cannot create quiz" });
      }
    }
  },
);

quizzesRouter.get("/:id/quizzes", ensureAuthenticated, async (req, res) => {
  if (req.query.page !== undefined && isNaN(+req.query.page)) {
    return res.status(422).json({ error: "Invalid query parameters" });
  }
  let limit = +req.query.limit;
  if (isNaN(limit)) {
    limit = 5;
  }
  let offset = +req.query.page * limit;
  if (isNaN(offset)) {
    offset = 0;
  }
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
  const quizzes = await Quiz.findAll({
    where: { UserId: req.params.id },
    limit,
    offset,
  });
  const totalQuizzes = await Quiz.count({ where: { UserId: req.params.id } });
  if (quizzes === null || totalQuizzes === null) {
    return res.status(404).json({ error: "Quizzes not found" });
  }
  return res.json({ quizzes, numPages: Math.ceil(totalQuizzes / limit) });
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
    if (questions === null) {
      return res.status(404).json({ error: "Questions not found" });
    }
    return res.json({ quiz: quiz, questions: questions });
  },
);

quizzesRouter.get("/:id/quizzes/:quizId/video", async (req, res) => {
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
  const quiz = await Quiz.findOne({
    where: { id: req.params.quizId, UserId: req.params.id },
  });
  if (!quiz) {
    return res.status(404).json({ error: "Quiz not found" });
  }
  if (
    !quiz.filename ||
    (quiz.filename.split(".").pop() !== "mp4" &&
      quiz.filename.split(".").pop() !== "mp3")
  ) {
    return res.status(404).json({ error: "Video not found" });
  }
  if (!fs.existsSync(`uploads/${quiz.filename}`)) {
    return res.status(500).json({ error: "File system error" });
  }
  const videoPath = `uploads/${quiz.filename}`;
  return res.sendFile(videoPath, { root: "." });
});

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
    try {
      const questions = await Question.destroy({ where: { QuizId: quiz.id } });
      fs.unlinkSync(uploadDir + quiz.filename);
      const quizDeleted = await Quiz.destroy({
        where: { id: req.params.quizId },
      });
      return res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(422).json({ error: "Quiz not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);
