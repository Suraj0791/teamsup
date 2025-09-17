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
const PORT = ENV.PORT || 3000;

// --- Middleware Setup ---
app.use(express.json());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware());

// --- Sentry Setup ---
Sentry.setupExpressErrorHandler(app);

// --- Route Setup ---
app.get("/", (req, res) => {
  res.send("Hello World! 123");
});

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signature: "svix", // Correctly configured for Clerk/Svix
  })
);

app.use("/api/chat", chatRoutes);


// --- Database Connection and Server Start ---
console.log("[SERVER] Attempting to connect to database...");
connectDB()
  .then(() => {
    console.log("[SERVER] Database connection successful!");
    app.listen(PORT, () => {
      console.log(`[SERVER] Server started successfully on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("CRITICAL: Failed to connect to database. Server did not start.", error);
    process.exit(1);
  });

export default app;