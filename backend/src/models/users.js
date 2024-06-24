import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Quiz } from "./quizzes.js";

export const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

User.hasMany(Quiz);
Quiz.belongsTo(User);
