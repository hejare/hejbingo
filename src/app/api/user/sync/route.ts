import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Missing email" },
                { status: 400 }
            );
        }

        const slackToken = process.env.SLACK_BOT_TOKEN;
        if (!slackToken) {
            return NextResponse.json(
                { error: "Missing SLACK_BOT_TOKEN" },
                { status: 500 }
            );
        }

        const slack = new WebClient(slackToken);

        // Try to find user by email
        const result = await slack.users.lookupByEmail({ email });

        if (!result.ok || !result.user) {
            console.warn(`Slack user not found for email: ${email}`);
            return NextResponse.json(
                { error: "User not found in Slack" },
                { status: 404 }
            );
        }

        const user = result.user;

        return NextResponse.json({
            success: true,
            slackId: user.id,
            realName: user.real_name || user.name,
            image: user.profile?.image_512 || user.profile?.image_192 || ""
        });

    } catch (error) {
        console.error("Error syncing user:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
