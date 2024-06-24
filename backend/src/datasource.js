import { Sequelize } from "sequelize";
import env from "dotenv";

env.config();

export const sequelize = new Sequelize({
  dialect: "postgres",
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  ssl: true,
  clientMinMessages: "notice",
});
