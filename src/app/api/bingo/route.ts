import { NextResponse } from "next/server";
import { postBingoMessage } from "@/lib/slack";
import { adminDb } from "@/lib/firebase-admin";
import { UserProfile } from "@/types";

export async function POST(request: Request) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "Missing UID" }, { status: 400 });
        }

        // Fetch user profile to get name
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userProfile = userDoc.data() as UserProfile;

        // Post to Slack
        await postBingoMessage(userProfile);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Bingo Notification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
