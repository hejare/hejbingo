import "server-only";
import { WebClient } from "@slack/web-api";
import { adminDb } from "@/lib/firebase-admin";
import { UserProfile } from "@/types";

export async function syncSlackUsers() {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
        throw new Error("Missing SLACK_BOT_TOKEN environment variable");
    }

    const client = new WebClient(token);

    try {
        console.log("Starting Slack sync...");

        // Fetch all users from Slack
        const result = await client.users.list({
            limit: 1000, // Adjust if needed
        });

        if (!result.ok || !result.members) {
            throw new Error(`Slack API error: ${result.error}`);
        }

        const users = result.members;
        console.log(`Found ${users.length} users in Slack.`);

        const batch = adminDb.batch();
        let count = 0;

        for (const user of users) {
            // Filter out bots, deleted users, and users without email
            if (user.is_bot || user.deleted || !user.profile?.email || user.id === "USLACKBOT") {
                continue;
            }

            const uid = user.id!; // Slack User ID
            const userRef = adminDb.collection("users").doc(uid);

            const userProfile: UserProfile = {
                uid: uid,
                displayName: user.real_name || user.name || "Unknown",
                email: user.profile.email,
                photoURL: user.profile.image_512 || user.profile.image_192 || user.profile.image_original || "",
                department: user.profile.title || "General", // Using title as department/role
                createdAt: Date.now(),
            };

            batch.set(userRef, userProfile, { merge: true });
            count++;
        }

        if (count > 0) {
            await batch.commit();
        }

        console.log(`Synced ${count} valid users from Slack.`);
        return { success: true, count };

    } catch (error) {
        console.error("Slack Sync Error:", error);
        throw error;
    }
}

export async function postBingoMessage(userProfile: UserProfile) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) return;

    const client = new WebClient(token);

    try {
        let channelId = process.env.SLACK_CHANNEL_ID;

        if (!channelId) {
            // Find channels where the bot is a member
            const channels = await client.conversations.list({
                types: "public_channel,private_channel",
                limit: 1000
            });

            // Filter for channels where the bot is a member
            const joinedChannels = channels.channels?.filter(c => c.is_member);

            if (joinedChannels && joinedChannels.length > 0) {
                // Use the first joined channel found
                // Ideally, we might want to prefer a specific one like #bingo if available among joined ones
                const bingoChannel = joinedChannels.find(c => c.name === "bingo");
                channelId = bingoChannel ? bingoChannel.id : joinedChannels[0].id;
                console.log(`Found joined channel: ${joinedChannels[0].name} (ID: ${channelId})`);
            } else {
                // Fallback: Try to find #bingo or #general even if not joined (requires chat:write.public)
                console.warn("No joined channels found. Trying to find #bingo or #general...");
                channelId = channels.channels?.find(c => c.name === "bingo")?.id;
                if (!channelId) {
                    channelId = channels.channels?.find(c => c.name === "general")?.id;
                }
            }
        }

        if (!channelId) {
            console.error("Could not find a channel to post Bingo message to.");
            return;
        }

        // Try to find Slack User ID by email if uid is not a Slack ID (Slack IDs usually start with U or W)
        let slackUserId = userProfile.uid;
        if (!slackUserId.startsWith("U") && !slackUserId.startsWith("W") && userProfile.email) {
            try {
                const lookup = await client.users.lookupByEmail({ email: userProfile.email });
                if (lookup.ok && lookup.user?.id) {
                    slackUserId = lookup.user.id;
                }
            } catch (e) {
                console.warn("Could not lookup user by email:", e);
            }
        }

        await client.chat.postMessage({
            channel: channelId,
            text: `*BINGO!*\n\n Grattis till to <@${slackUserId}> who just got a BINGO! 🎉`,
        });

    } catch (error) {
        console.error("Failed to post Bingo message to Slack:", error);
    }
}
