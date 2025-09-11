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


// --- THIS IS THE NEW "SPY" MIDDLEWARE ---
const spyOnHeaders = (req, res, next) => {
  console.log("--- INCOMING WEBHOOK HEADERS ---");
  console.log(JSON.stringify(req.headers, null, 2));
  console.log("---------------------------------");
  next();
};
// -----------------------------------------


app.get("/", (req, res) => {
  res.send("Hello World! 123");
});

// Apply the spy middleware ONLY to the inngest route
app.use("/api/inngest", spyOnHeaders, serve({ client: inngest, functions, signingKey: ENV.INNGEST_SIGNING_KEY }));

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