import { Router } from "express";
import { User } from "../models/users.js";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { body, validationResult } from "express-validator";
import { ensureAuthenticated } from "../middlewares/auth.js";

export const usersRouter = Router();

usersRouter.get("/me", ensureAuthenticated, async (req, res) => {
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

usersRouter.get("/:id/quizzes", ensureAuthenticated, async (req, res) => {
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
  // Include questions in the response
  const questions = await Question.findAll({ where: { QuizId: quiz.id } });
  return res.json({ quiz: quiz, questions: questions });
});

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
