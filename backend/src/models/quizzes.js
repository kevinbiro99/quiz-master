import { DataTypes } from "sequelize";
import { sequelize } from "../datasource.js";
import { Question } from "./questions.js";

export const Quiz = sequelize.define("Quiz", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Quiz.hasMany(Question);
Question.belongsTo(Quiz);
