import cors from "cors";
import { usersRouter } from "./routers/users_router.js";
import { quizzesRouter } from "./routers/quizzes_router.js";
import { authRouter } from "./routers/auth.js";
import { sequelize } from "./datasource.js";
import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import { initializeSocket } from "./socket.js";
import { createServer } from "http";
import passport from "passport";
import session from "express-session";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { quizJobQueue } from "./task_queues/quiz_task_queue.js";
import { createProgressRouter } from "./routers/progress_router.js";

env.config();
export const app = express();
const httpServer = createServer(app);

app.use(express.static("static"));
const corsOptions = {
  origin: process.env.API_CORS_URL,
  credentials: true,
};

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));

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

const serverAdapter = new ExpressAdapter();
const bullBoard = createBullBoard({
  queues: [new BullMQAdapter(quizJobQueue)],
  serverAdapter: serverAdapter,
});
serverAdapter.setBasePath("/admin");

app.use("/api/users", usersRouter);
app.use("/api/users", quizzesRouter);
app.use("/auth", authRouter);
app.use("/admin", serverAdapter.getRouter());
app.use("/api/progress", createProgressRouter());

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

initializeSocket(server, sessionMiddleware);
