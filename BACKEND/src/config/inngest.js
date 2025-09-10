import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import User from "../models/user.model.js"; // Corrected import syntax
import { ENV } from "./env.js";

// --- 1. Inngest Client Initialization ---
console.log("Initializing Inngest client...");
export const inngest = new Inngest({ id: "slack-clone-backend" });

// --- 2. Inngest Function to Sync New Users ---
// This function runs when a user is created in Clerk.
// It saves a corresponding user document in your MongoDB database.
const syncUser = inngest.createFunction(
  { id: "sync-user-to-db" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      console.log("[Inngest] Received event: clerk/user.created");
      console.log("[Inngest] Clerk User ID:", event.data?.id);

      // Connect to the database
      await connectDB();
      console.log("[Inngest] Database connection established.");

      // Prepare user data for your database schema
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const newUser = {
        clerkId: id,
        email: email_addresses[0]?.email_address,
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        image: image_url,
      };

      // Save the new user to MongoDB
      console.log("[Inngest] Creating user in database...");
      const user = await User.create(newUser);
      console.log("[Inngest] Successfully created user in database. MongoDB ID:", user._id);

      return { success: true, message: "User synced successfully." };
    } catch (error) {
      console.error("[Inngest] CRITICAL: Failed to sync user.", {
        clerkId: event.data?.id,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      // Re-throw the error to let Inngest know the function failed and should be retried
      throw error;
    }
  }
);

// --- 3. Inngest Function to Delete Users ---
// This function runs when a user is deleted in Clerk.
// It removes the corresponding user document from your MongoDB database.
const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      console.log("[Inngest] Received event: clerk/user.deleted");
      // The user object might be null if it's a hard delete, so we check for id
      const clerkId = event.data?.id;
      if (!clerkId) {
        console.warn("[Inngest] Delete event received without a user ID. Skipping.");
        return { success: false, message: "No user ID provided." };
      }
      console.log("[Inngest] Clerk User ID to delete:", clerkId);

      // Connect to the database
      await connectDB();
      console.log("[Inngest] Database connection established.");
      
      // Delete the user from MongoDB
      console.log("[Inngest] Deleting user from database...");
      const deleteResult = await User.deleteOne({ clerkId: clerkId });

      if (deleteResult.deletedCount > 0) {
        console.log("[Inngest] Successfully deleted user from database.");
      } else {
        console.warn("[Inngest] User to delete was not found in the database.");
      }
      
      return { success: true, message: "User processed for deletion." };
    } catch (error) {
      console.error("[Inngest] CRITICAL: Failed to delete user.", {
        clerkId: event.data?.id,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      // Re-throw the error for retries
      throw error;
    }
  }
);

// --- 4. Export Functions for Inngest ---
export const functions = [syncUser, deleteUserFromDB];