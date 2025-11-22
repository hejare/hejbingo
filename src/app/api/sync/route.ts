import { NextResponse } from "next/server";
import { syncDirectoryUsers } from "@/lib/directory";

export async function POST(request: Request) {
    console.log("Sync Request Started");
    console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

    try {
        // In a real app, verify admin permissions here!
        // For now, we assume this endpoint is protected or only called by authorized admins.

        const result = await syncDirectoryUsers();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("SYNC ERROR DETAILS:", error);
        return NextResponse.json({
            error: error.message,
            details: error.response?.data || error.stack
        }, { status: 500 });
    }
}
