import cors from "cors";
import { usersRouter } from "./routers/users_router.js";
import { sequelize } from "./datasource.js";
import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";

env.config();
export const app = express();

app.use(cors());
app.use(bodyParser.json());

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
  console.log(
    "Connection has been established successfully.",
    sequelize.config,
  );
} catch (error) {
  console.error("Unable to connect to the database:", sequelize.config, error);
}

app.use("/api/users", usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
