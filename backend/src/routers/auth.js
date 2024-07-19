import express from "express";
import passport from "../config/passport_config.js";

export const authRouter = express.Router();

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/auth-success",
    failureRedirect: "/login",
  })
);

authRouter.get("/logout", (req, res) => {
  delete req.session.username;
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
  });
  return res.json({ message: "Logged out" });
});
