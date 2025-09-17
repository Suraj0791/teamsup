import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js";
import { addUserToPublicChannels, deleteStreamUser, upsertStreamUser } from "./stream.js";
import { ENV } from "./env.js"; // Import the ENV object

// Create a client to send and receive events, explicitly providing the signing key
// Directly read from the environment, bypassing the ENV object for this one key.
// const INNGEST_SIGNING_KEY = "signkey-prod-7809ca11d17a2c3af15e462445a8fbee9515544de532f17591620cfcbf2c9352";

// export const inngest = new Inngest({ 
//   id: "slack-clone",
//   signingKey: INNGEST_SIGNING_KEY 
// });


// Use the signing key from your environment variables
export const inngest = new Inngest({ 
  id: "slack-clone",
  signingKey: ENV.INNGEST_SIGNING_KEY 
});

console.log(`[INNGEST CONFIG] Signing Key Status: ${ENV.INNGEST_SIGNING_KEY ? `Found (starts with: ${ENV.INNGEST_SIGNING_KEY.slice(0, 15)}...)` : "NOT FOUND"}`);

/**
 * This function is triggered when a 'user.created' event is received from Clerk.
 * It syncs the new user's data to your MongoDB and your Stream chat service.
 */
const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();

    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const newUser = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      image: image_url,
    };

    // Create the user in your own database
    await User.create(newUser);

    // Create or update the user in Stream's chat service
    await upsertStreamUser({
      id: newUser.clerkId.toString(),
      name: newUser.name,
      image: newUser.image,
    });

    // Automatically add the new user to public channels
    await addUserToPublicChannels(newUser.clerkId.toString());
  }
);

/**
 * This function is triggered when a 'user.deleted' event is received from Clerk.
 * It removes the user's data from your MongoDB and your Stream chat service.
 */
const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();
    const { id } = event.data;
    
    // Delete from your database
    await User.deleteOne({ clerkId: id });

    // Delete from Stream's chat service
    await deleteStreamUser(id.toString());
  }
);

// Export all the functions for the Inngest server to use
export const functions = [syncUser, deleteUserFromDB];