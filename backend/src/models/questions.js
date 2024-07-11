import { DataTypes } from "sequelize";
import { sequelize } from "../datasource.js";

export const Question = sequelize.define("Question", {
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  option2: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  option3: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  option4: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  correctAnswer: {
    type: DataTypes.ENUM("option1", "option2", "option3", "option4"),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
