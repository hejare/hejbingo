import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
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
                    // Create initial game state
                    if (users.length > 0) {
                        const board = generateBoard(users, user.uid);
                        const newGame: GameState = {
                            uid: user.uid,
                            board,
                            collectedUids: [],
                            isBingo: false,
                            lastUpdated: Date.now(),
                        };
                        await setDoc(gameRef, newGame);
                        setGameState(newGame);
                    }
                }
                setLoading(false);
            });

            return unsubscribe;
        };

        fetchUsersAndGame();
    }, [user]);

    return { gameState, allUsers, loading };
}
