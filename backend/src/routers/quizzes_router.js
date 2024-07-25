import { Router } from "express";
import { User } from "../models/users.js";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { body, validationResult } from "express-validator";
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

const upload = multer({ storage: storage });

config();

export const quizzesRouter = Router();

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

      await quizJobQueue.add("quizFromTranscript", {
        filename: audioFile.filename,
        uploadDir: uploadDir,
        id,
      });
      return res.status(202).json({ message: "Quiz creation in progress" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
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

      await quizJobQueue.add("quizFromAudio", {
        filename: audioFile.filename,
        uploadDir: uploadDir,
        id,
      });
      return res.status(202).json({ message: "Quiz creation in progress" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
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

      await quizJobQueue.add("quizFromVideo", {
        filename: videoFile.filename,
        uploadDir: uploadDir,
        id,
      });
      return res.status(202).json({ message: "Quiz creation in progress" });
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(422).json({ error: "User not found" });
      } else if (error.name === "SequelizeValidationError") {
        return res.status(422).json({
          error: "Invalid input parameters. Expected id and file",
        });
      } else {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  },
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
  },
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
  },
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
    fs.unlinkSync(uploadDir + quiz.filename);
    const quizDeleted = await Quiz.destroy({
      where: { id: req.params.quizId },
    });
    return res.json({ message: "Quiz deleted successfully" });
  },
);
