import "../instrument.mjs";
import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./config/inngest.js";
import { serve } from "inngest/express";
import chatRoutes from "./routes/chat.route.js";
import cors from "cors";
import * as Sentry from "@sentry/node";

const app = express();
app.use(express.json());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Hello World! 123");
});

// HARDCODED SIGNING KEY FOR DEBUGGING
const INNGEST_SIGNING_KEY = "signkey-prod-7809ca11d17a2c3af15e462445a8fbee9515544de532f17591620cfcbf2c9352";

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: INNGEST_SIGNING_KEY,
    signature: "svix",
  })
);

app.use("/api/chat", chatRoutes);

Sentry.setupExpressErrorHandler(app);

const PORT = ENV.PORT || 3000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server started successfully on port: ${PORT}`);
    });
  } catch (error) {
    console.error("CRITICAL: Error starting server:", error);
    process.exit(1);
  }
};
startServer();
export default app;