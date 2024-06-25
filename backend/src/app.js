import cors from "cors";
import { usersRouter } from "./routers/users_router.js";
import { sequelize } from "./datasource.js";
import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import { initializeSocket } from "./socket.js";
import { createServer } from "http";

env.config();
export const app = express();
const httpServer = createServer(app);

app.use(express.static("static"));
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
  console.log(
    "Connection has been established successfully.",
    sequelize.config
  );
} catch (error) {
  console.error("Unable to connect to the database:", sequelize.config, error);
}

app.use("/api/users", usersRouter);

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

initializeSocket(server);
