import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Quiz } from "./quizzes.js";

export const User = sequelize.define("User", {
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

User.hasMany(Quiz);
Quiz.belongsTo(User);
