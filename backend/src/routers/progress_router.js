import express from "express";
import { quizJobQueue } from "../task_queues/quiz_task_queue.js";

export function createProgressRouter() {
  const router = express.Router();

  router.get("/:jobId", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const { jobId } = req.params;

    const sendProgressUpdate = (progress) => {
      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
    };

    const intervalId = setInterval(async () => {
      const job = await quizJobQueue.getJob(jobId);
      if (job) {
        const progress = job.progress;
        sendProgressUpdate(progress);
        if (job.failedReason) {
          sendFailureUpdate(new Error(job.failedReason));
          clearInterval(intervalId);
          res.end();
        }
      } else {
        clearInterval(intervalId);
        res.end();
      }
    }, 300);

    req.on("close", () => {
      clearInterval(intervalId);
      res.end();
    });
  });

  return router;
}
