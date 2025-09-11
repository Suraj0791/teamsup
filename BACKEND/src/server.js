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

// --- THE FINAL FIX IS HERE ---
// We are now telling the Inngest server to use the 'svix' signature
// which matches the headers being sent by Clerk.
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: ENV.INNGEST_SIGNING_KEY,
    signature: "svix", // <-- ADD THIS LINE
  })
);
// -----------------------------

app.use("/api/chat", chatRoutes);

Sentry.setupExpressErrorHandler(app);

const PORT = ENV.PORT || 5001;

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