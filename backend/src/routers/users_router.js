import { Router } from "express";
import { User } from "../models/users.js";

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
