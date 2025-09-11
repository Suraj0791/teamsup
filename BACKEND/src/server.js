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

// --- NEW, MORE POWERFUL DEBUG LOG ---
const key = process.env.INNGEST_SIGNING_KEY;
console.log(`[SERVER DEBUG] Inngest Signing Key Status: ${key ? `Found (starts with: ${key.slice(0, 15)}...)` : "🔴🔴🔴 NOT FOUND 🔴🔴🔴"}`);
// ------------------------------------

const app = express();
// ... (rest of the file is the same)
app.use(express.json());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Hello World! 123");
});

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: process.env.INNGEST_SIGNING_KEY, // Also read directly here
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