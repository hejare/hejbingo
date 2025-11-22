import "server-only";
import { google } from "googleapis";
import { dbAdmin } from "@/lib/firebase-admin";
import { UserProfile } from "@/types";

export async function syncDirectoryUsers() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
        // IMPORTANT: You must impersonate an admin user to access the Directory API
        clientOptions: {
            subject: process.env.GOOGLE_ADMIN_EMAIL,
        },
    });

    const service = google.admin({ version: "directory_v1", auth });

    try {
        // TEST FIRESTORE CONNECTION
        try {
            console.log("Testing Firestore connection...");
            const collections = await dbAdmin.listCollections();
            console.log("Firestore connected. Collections:", collections.map(c => c.id));
        } catch (dbError) {
            console.error("Firestore Connection Failed:", dbError);
            throw new Error("Could not connect to Firestore. Check Project ID and Permissions.");
        }

        const res = await service.users.list({
            customer: "my_customer", // "my_customer" is a special alias for the current account
            maxResults: 500,
            orderBy: "email",
        });

        const users = res.data.users;
        if (!users || users.length === 0) {
            console.log("No users found.");
            return { success: true, count: 0 };
        }

        const batch = dbAdmin.batch();
        let count = 0;

        for (const user of users) {
            if (!user.primaryEmail || !user.name) continue;

            // Use email as UID for simplicity in this sync, OR try to map to existing Firebase UIDs if possible.
            // Ideally, we want to use the Google User ID (user.id) which matches the 'sub' claim in OIDC tokens.
            // However, Firebase Auth UIDs are usually the same as Google User IDs if using Google Sign-In.

            const uid = user.id!;
            const userRef = dbAdmin.collection("users").doc(uid);

            const userProfile: UserProfile = {
                uid: uid,
                displayName: user.name.fullName || user.primaryEmail,
                email: user.primaryEmail,
                photoURL: user.thumbnailPhotoUrl || "",
                department: (user.organizations && user.organizations[0]?.department) || "General",
                createdAt: Date.now(), // This might overwrite creation time, maybe check existence first?
                // For sync, we might want to merge, but set() with merge: true is good.
            };

            batch.set(userRef, userProfile, { merge: true });
            count++;
        }

        await batch.commit();
        console.log(`Synced ${count} users.`);
        return { success: true, count };

    } catch (error) {
        console.error("Directory Sync Error:", error);
        throw error;
    }
}
