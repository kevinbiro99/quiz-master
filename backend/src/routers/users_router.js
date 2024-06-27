import { Router } from "express";
import { User } from "../models/users.js";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { body, validationResult } from "express-validator";
import { config } from "dotenv";
import fs from "fs";
import Groq from "groq-sdk";

config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const usersRouter = Router();

usersRouter.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.create({ username, password });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

usersRouter.get("/", async (req, res) => {
  const users = await User.findAll();
  return res.json(users);
});

usersRouter.post(
  "/:id/quizzes",
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
        })
      );

      await Promise.all(questionPromises);

      return res
        .status(201)
        .json({ message: "Quiz created successfully", quiz });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

usersRouter.post("/:id/temp/quizzes", async (req, res) => {
  const id = req.params.id;
  const link = req.body.link;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const filePath = "./assets/transcript-short.txt";
    const fileContent = fs.readFileSync(filePath, "utf-8");
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

        lines.forEach((line) => {
          if (line === "") {
            return;
          }
        });

        if (lines.length < 8) {
          return;
        }

        let answer = lines[6].split("**Answer**")[1];
        if (answer[0].toLowerCase() === "a") {
          answer = "option1";
        } else if (answer[0].toLowerCase() === "b") {
          answer = "option2";
        } else if (answer[0].toLowerCase() === "c") {
          answer = "option3";
        } else if (answer[0].toLowerCase() === "d") {
          answer = "option4";
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

    await Promise.all(questionPromises);

    return res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

usersRouter.get("/:id/quizzes", async (req, res) => {
  const quizzes = await Quiz.findAll({ where: { UserId: req.params.id } });
  return res.json(quizzes);
});

usersRouter.get("/:id/quizzes/:quizId", async (req, res) => {
  const quiz = await Quiz.findOne({
    where: { id: req.params.quizId, UserId: req.params.id },
  });
  if (!quiz) {
    return res.status(404).json({ error: "Quiz not found" });
  }
  return res.json(quiz);
});

usersRouter.delete("/:id/", async (req, res) => {
  const quizzes = await Quiz.findAll({ where: { UserId: req.params.id } });
  const quizIds = quizzes.map((quiz) => quiz.id);
  const questions = await Question.destroy({ where: { QuizId: quizIds } });
  const quizzesDeleted = await Quiz.destroy({
    where: { UserId: req.params.id },
  });
  const users = await User.destroy({ where: { id: req.params.id } });
  return res.json({ message: "User deleted successfully" });
});
