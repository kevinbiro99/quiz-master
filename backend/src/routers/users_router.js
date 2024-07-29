import { Router } from "express";
import { User } from "../models/users.js";
import { Quiz } from "../models/quizzes.js";
import { Question } from "../models/questions.js";
import { body, validationResult } from "express-validator";
import { ensureAuthenticated } from "../middlewares/auth.js";
import bcrypt from "bcrypt";
import sequelize from "sequelize";

export const usersRouter = Router();

usersRouter.get("/me", ensureAuthenticated, async (req, res) => {
  if (req.session.username) {
    const user = await User.findOne({
      where: { username: req.session.username },
    });
    if (user === null) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ username: req.session.username, id: user.id });
  }
  return res.json(req.user);
});

usersRouter.get("/", async (req, res) => {
  if (req.query.page !== undefined && isNaN(+req.query.page)) {
    return res.status(422).json({ error: "Invalid query parameters" });
  }

  let limit = +req.query.limit;
  if (isNaN(limit)) {
    limit = 10;
  }

  let offset = +req.query.page * limit;
  if (isNaN(offset)) {
    offset = 0;
  }

  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        [
          sequelize.literal(`(
          SELECT COUNT(*)
          FROM "Quizzes"
          WHERE "Quizzes"."UserId" = "User"."id"
        )`),
          "quizCount",
        ],
        [
          sequelize.literal(`(
          SELECT COUNT(*)
          FROM "Questions"
          INNER JOIN "Quizzes" ON "Quizzes"."id" = "Questions"."QuizId"
          WHERE "Quizzes"."UserId" = "User"."id"
        )`),
          "questionCount",
        ],
      ],
      limit: limit,
      offset: offset,
      raw: true,
    });

    if (users === null) {
      return res.status(404).json({ error: "Users not found" });
    }

    const numUsers = await User.count();
    return res.json({
      users: users,
      numPages: Math.ceil(numUsers / limit),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
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

  try {
    const user = User.build({
      username: req.body.username,
      googleId: null,
      email: null,
    });
    user.password = password;
    await user.save();
  } catch (e) {
    if (e.name === "SequelizeValidationError") {
      return res.status(422).json({
        error: "Invalid input parameters. Expected username.",
      });
    } else if (e.name === "SequelizeUniqueConstraintError") {
      return res.status(422).json({ error: "Username already exists." });
    } else {
      return res.status(400).json({ error: "Cannot create user." });
    }
  }
  return res.json({
    success: "User created successfully.",
    username: user.username,
  });
});
