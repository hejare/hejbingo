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
                } else {
                    // Create new user profile
                    const newProfile: UserProfile = {
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName || "Anonymous",
                        email: firebaseUser.email || "",
                        photoURL: firebaseUser.photoURL || "",
                        department: "Unknown",
                        createdAt: Date.now(),
                    };
                    await setDoc(userRef, newProfile);
                    setUserProfile(newProfile);
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
