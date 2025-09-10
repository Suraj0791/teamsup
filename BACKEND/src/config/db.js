import mongoose from "mongoose";
import { ENV } from "./env.js";

// Check if we already have a connection
let cachedConnection = null;

export const connectDB = async () => {
  // If we have a cached connection, use it
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      // These options make the connection more reliable for serverless environments
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    });

    cachedConnection = conn;
    console.log("MongoDB connected successfully:", conn.connection.host);
    return conn;
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);

    // Don't exit the process in a serverless environment
    if (ENV.NODE_ENV === "production") {
      throw error; // Just throw the error, don't kill the process in production
    } else {
      process.exit(1); // Only exit in development
    }
  }
};
