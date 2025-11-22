"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { UserProfile } from "@/types";

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Sync with Firestore
                const userRef = doc(db, "users", firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const profile = userSnap.data() as UserProfile;
                    setUserProfile(profile);
                    // Update last login
                    await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
                }

                // Sync with Slack
                try {
                    const res = await fetch("/api/user/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: firebaseUser.email }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            const updatedProfile: Partial<UserProfile> = {
                                displayName: data.realName,
                                photoURL: data.image,
                                slackId: data.slackId,
                            };

                            await setDoc(userRef, updatedProfile, { merge: true });

                            // Update local state if we already have a profile, or create new one if not
                            setUserProfile(prev => prev ? { ...prev, ...updatedProfile } : {
                                uid: firebaseUser.uid,
                                displayName: data.realName,
                                email: firebaseUser.email || "",
                                photoURL: data.image,
                                slackId: data.slackId,
                                department: "Unknown",
                                createdAt: Date.now(),
                            });
                        }
                    }
                } catch (e) {
                    console.error("Failed to sync with Slack", e);
                }

                if (!userSnap.exists() && !userProfile) {
                    // Fallback creation if Slack sync failed or didn't happen yet and no profile exists
                    // This might be overwritten by the sync above if it succeeds later, but good for immediate feedback
                    // Actually, let's just wait for sync or use basic info
                    const newProfile: UserProfile = {
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName || "Anonymous",
                        email: firebaseUser.email || "",
                        photoURL: firebaseUser.photoURL || "",
                        department: "Unknown",
                        createdAt: Date.now(),
                    };
                    // Only set if we haven't set it yet (e.g. sync failed)
                    if (!userProfile) { // This check is tricky because of async state updates. 
                        // Better to rely on the setDoc above.
                        await setDoc(userRef, newProfile, { merge: true });
                        setUserProfile(prev => prev || newProfile);
                    }
                }

                if (pathname === "/login") {
                    router.push("/");
                }
            } else {
                setUserProfile(null);
                if (pathname !== "/login") {
                    router.push("/login");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading }}>
            {!loading ? children : <div className="h-screen w-screen flex items-center justify-center">Loading...</div>}
        </AuthContext.Provider>
    );
}
