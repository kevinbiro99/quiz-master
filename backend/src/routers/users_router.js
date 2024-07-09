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
    cb(null, "transcript.txt");
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

usersRouter.post(
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
      const fileContent = fs.readFileSync(textFile.path, "utf8");
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
                    `;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

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

      const title = response.split("\n")[0];
      const quiz = await Quiz.create({ title, UserId: id });

      const questionPromises = response
        .split("\n\n")
        .slice(1)
        .map((question) => {
          const lines = question.split("\n");

          //TODO: output validation
          lines.forEach((line) => {
            if (line === "") {
              return;
            }
          });

          if (lines.length < 8) {
            return;
          }

          let answer = lines[6].split(" ")[1].charAt(0).toLowerCase();
          if (
            answer !== "a" &&
            answer !== "b" &&
            answer !== "c" &&
            answer !== "d"
          ) {
            return;
          }

          switch (answer) {
            case "a":
              answer = "option1";
              break;
            case "b":
              answer = "option2";
              break;
            case "c":
              answer = "option3";
              break;
            case "d":
              answer = "option4";
              break;
          }

          Question.create({
            QuizId: quiz.id,
            text: lines[1],
            option1: lines[2],
            option2: lines[3],
            option3: lines[4],
            option4: lines[5],
            correctAnswer: answer,
            timestamp: lines[7],
          });
        });

      //TODO: Unhandled promise rejection
      await Promise.all(questionPromises).catch((error) => {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      });

      return res
        .status(201)
        .json({ message: "Quiz created successfully", quiz });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

usersRouter.get("/:id/quizzes", ensureAuthenticated, async (req, res) => {
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

usersRouter.get(
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

usersRouter.delete(
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
  },
);

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
