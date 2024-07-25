import { Router } from "express";
import { User } from "../models/users.js";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { body, validationResult } from "express-validator";
import { ensureAuthenticated } from "../middlewares/auth.js";
import { config } from "dotenv";
import Groq from "groq-sdk";
import multer from "multer";
import fs from "fs";
import bcrypt from "bcrypt";

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
export const usersRouter = Router();

usersRouter.get("/me", ensureAuthenticated, async (req, res) => {
  if (req.session.username) {
    const user = await User.findOne({
      where: { username: req.session.username },
    });
    return res.json({ username: req.session.username, id: user.id });
  }
  return res.json(req.user);
});

usersRouter.get("/", async (req, res) => {
  const users = await User.findAll({
    attributes: ["username", "id"],
  });
  return res.json(users);
});

usersRouter.post(
  "/:id/quizzes",
  ensureAuthenticated,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("questions")
      .isArray({ min: 1 })
      .withMessage("Questions must be an array with at least one question"),
    body("questions.*.text")
      .notEmpty()
      .withMessage("Question text is required"),
    body("questions.*.option1").notEmpty().withMessage("Option1 is required"),
    body("questions.*.option2").notEmpty().withMessage("Option2 is required"),
    body("questions.*.option3").notEmpty().withMessage("Option3 is required"),
    body("questions.*.option4").notEmpty().withMessage("Option4 is required"),
    body("questions.*.correctAnswer")
      .isIn(["option1", "option2", "option3", "option4"])
      .withMessage("Correct answer must be one of the options"),
  ],
  async (req, res) => {
    const id = req.params.id;
    const { title, questions } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log(id);
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const quiz = await Quiz.create({ title, UserId: id });

      const questionPromises = questions.map((question) =>
        Question.create({
          QuizId: quiz.id,
          text: question.text,
          option1: question.option1,
          option2: question.option2,
          option3: question.option3,
          option4: question.option4,
          correctAnswer: question.correctAnswer,
        }),
      );

      await Promise.all(questionPromises);

      return res
        .status(201)
        .json({ message: "Quiz created successfully", quiz });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

usersRouter.delete("/:id/", ensureAuthenticated, async (req, res) => {
  const quizzes = await Quiz.findAll({ where: { UserId: req.params.id } });
  const quizIds = quizzes.map((quiz) => quiz.id);
  const questions = await Question.destroy({ where: { QuizId: quizIds } });
  const quizzesDeleted = await Quiz.destroy({
    where: { UserId: req.params.id },
  });
  const users = await User.destroy({ where: { id: req.params.id } });
  return res.json({ message: "User deleted successfully" });
});

usersRouter.post("/signin", async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.body.username,
    },
  });
  if (user === null) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  // This user has signed up with Google so they must sign in with Google
  if (user.password === null) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const hash = user.password;
  const password = req.body.password;
  const result = bcrypt.compareSync(password, hash);
  if (!result) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  req.session.username = user.username;

  return res.json({
    success: "Sign in successful.",
    user_id: user.id,
  });
});

usersRouter.post("/signup", async (req, res) => {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const password = bcrypt.hashSync(req.body.password, salt);

  const user = User.build({
    username: req.body.username,
    googleId: null,
    email: null,
  });
  user.password = password;
  try {
    await user.save();
  } catch {
    return res.status(422).json({ error: "User creation failed." });
  }
  return res.json({
    success: "User created successfully.",
    username: user.username,
  });
});
