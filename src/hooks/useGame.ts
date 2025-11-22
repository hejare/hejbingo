import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { GameState, UserProfile } from "@/types";
import { generateBoard, checkBingo } from "@/lib/game-logic";

export function useGame() {
    const { user } = useAuth();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchUsersAndGame = async () => {
            // Fetch all users for board generation/display
            const usersSnap = await getDocs(collection(db, "users"));
            const users = usersSnap.docs.map(d => d.data() as UserProfile);
            setAllUsers(users);

            // Listen to GameState
            const gameRef = doc(db, "game_states", user.uid);
            const unsubscribe = onSnapshot(gameRef, async (snap) => {
                if (snap.exists()) {
                    setGameState(snap.data() as GameState);
                } else {
                    setGameState(null);
                }
                setLoading(false);
            });

            return unsubscribe;
        };

        fetchUsersAndGame();
    }, [user]);

    const registerScan = async (scannedUid: string): Promise<{ success: boolean; message: string }> => {
        if (!user || !gameState) return { success: false, message: "Ingen aktiv session" };

        // Basic validation
        if (!scannedUid || scannedUid.length < 5) return { success: false, message: "Ogiltig kod" };

        // Check if already collected
        if (gameState.collectedUids.includes(scannedUid)) {
            return { success: false, message: "Redan tagen!" };
        }

        // Check if on board
        if (!gameState.board.includes(scannedUid)) {
            return { success: false, message: "Inte på din bricka tyvärr!" };
        }

        try {
            const gameRef = doc(db, "game_states", user.uid);
            const newCollected = [...gameState.collectedUids, scannedUid];
            const isBingo = checkBingo(gameState.board, newCollected);

            await updateDoc(gameRef, {
                collectedUids: arrayUnion(scannedUid),
                isBingo: isBingo,
                lastUpdated: Date.now()
            });

            if (isBingo && !gameState.isBingo) {
                // Trigger Slack notification (fire and forget)
                fetch("/api/bingo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: user.uid }),
                });
            }

            return { success: true, message: isBingo ? "BINGO!!!" : "Träff!" };
        } catch (e) {
            console.error(e);
            return { success: false, message: "Kunde inte spara..." };
        }
    };

    return { gameState, allUsers, loading, registerScan };
}
