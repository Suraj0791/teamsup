import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js"; // Import the User model
import { addUserToPublicChannels, deleteStreamUser, upsertStreamUser } from "./stream.js";

// When a user is created in Clerk, syncUser runs: adds them to your DB and chat system.
// When a user is deleted in Clerk, deleteUserFromDB runs: removes them from your DB and chat system.
// Inngest handles the event listening and function execution.



// Create a client to send and receive events
export const inngest = new Inngest({ id: "slack-clone" });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();

    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const newUser = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      name: `${first_name || ""} ${last_name || ""}`,
      image: image_url,
    };

    await User.create(newUser);


    //upsertStreamUser: Adds or updates the user in your chat/stream system (so they can chat).




    // addUserToPublicChannels: Automatically adds the new user to public chat channels (so they’re part of the community).


//      When a user signs up (event from Clerk), you want to:
// Save them in your database.
// Add them to your chat system.
// Put them in public channels.
// Doing it all in one function ensures everything stays in sync automatically.



  }
);

const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();
    const { id } = event.data;
    await User.deleteOne({ clerkId: id });

    await deleteStreamUser(id.toString());
  }
);

export const functions = [syncUser, deleteUserFromDB];