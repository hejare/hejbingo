import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

import { generateBoard } from "@/lib/game-logic";
import { UserProfile } from "@/types";

export async function POST(request: Request) {
    try {
        const slackToken = process.env.SLACK_BOT_TOKEN;
        const blockedEmails = (process.env.BLOCKED_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e);

        if (!slackToken) {
            return NextResponse.json(
                { error: "Missing SLACK_BOT_TOKEN" },
                { status: 500 }
            );
        }

        const slack = new WebClient(slackToken);
        const result = await slack.users.list({});

        if (!result.members) {
            return NextResponse.json(
                { error: "Failed to fetch users from Slack" },
                { status: 500 }
            );
        }

        const users: UserProfile[] = result.members
            .filter((m) => {
                const isBot = m.is_bot;
                const isDeleted = m.deleted;
                const email = m.profile?.email?.toLowerCase();
                const isBlocked = email && blockedEmails.includes(email);
                return !isBot && !isDeleted && !isBlocked && email;
            })
            .map((m) => ({
                uid: m.id!,
                displayName: m.real_name || m.name!,
                email: m.profile?.email!,
                photoURL: m.profile?.image_512 || m.profile?.image_192 || "",
                createdAt: Date.now(),
            }));

        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json(
                { error: "Missing UID" },
                { status: 400 }
            );
        }

        // Generate board for the user
        const board = generateBoard(users, uid);

        // Return the data so the client can save it
        return NextResponse.json({
            success: true,
            users,
            board
        });
    } catch (error) {
        console.error("Error creating board:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
