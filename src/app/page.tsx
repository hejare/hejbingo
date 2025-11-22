"use client";

import { useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { useGame } from "@/hooks/useGame";
import { auth, db } from "@/lib/firebase";
import { writeBatch, doc } from "firebase/firestore";
import Link from "next/link";
import { Scan, QrCode, Trophy } from "lucide-react";
import { BingoOverlay } from "@/components/BingoOverlay";

export default function Home() {
  const { user, userProfile } = useAuth();
  const { gameState, allUsers, loading, registerScan } = useGame();

  const [creating, setCreating] = useState(false);
  const [devMode, setDevMode] = useState(false);

  const createBoard = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/board/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userProfile?.slackId || user?.uid }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Save to Firestore using client SDK
      const batch = writeBatch(db);

      // Save users
      data.users.forEach((u: any) => {
        const ref = doc(db, "users", u.uid);
        batch.set(ref, u, { merge: true });
      });

      // Save game state
      const newGame = {
        uid: user?.uid,
        board: data.board,
        collectedUids: [],
        isBingo: false,
        lastUpdated: Date.now(),
      };
      const gameRef = doc(db, "game_states", user!.uid);
      batch.set(gameRef, newGame);

      await batch.commit();

      // Force reload or state update? useGame hook should pick it up via onSnapshot
    } catch (e) {
      console.error(e);
      alert("Failed to create board");
    } finally {
      setCreating(false);
    }
  };

  const handleTileClick = async (uid: string) => {
    if (!devMode || !registerScan) return;

    if (confirm(`Dev Mode: Simulera scan av ${uid}?`)) {
      const { success, message } = await registerScan(uid);
      alert(message);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading game...</div>;

  if (!gameState) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold text-gray-800">Välkommen till Hejare Bingo!</h1>
        <p className="text-center text-gray-600 max-w-xs">
          För att börja spela behöver du en bingobricka med dina kollegor.
        </p>
        <button
          onClick={createBoard}
          disabled={creating}
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {creating ? (
            <>
              <span className="animate-spin">⏳</span> Skapar bricka...
            </>
          ) : (
            "Skapa bingo-bräda"
          )}
        </button>
      </div>
    );
  }

  const getUser = (uid: string) => allUsers.find(u => u.uid === uid);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {gameState.isBingo && <BingoOverlay onComplete={() => { }} />}
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <h1 className="text-xl font-bold text-gray-800">Hejare Bingo</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">{gameState.collectedUids.length} / 25</span>
            {gameState.isBingo && <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />}
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="p-4 max-w-md mx-auto">
        <div className="grid grid-cols-5 gap-2 aspect-square">
          {gameState.board.map((uid, idx) => {
            const cellUser = getUser(uid);
            const isCollected = gameState.collectedUids.includes(uid) || uid === "FREE_SPACE";
            const isFree = uid === "FREE_SPACE";

            return (
              <div
                key={idx}
                onClick={() => !isFree && !isCollected && handleTileClick(uid)}
                className={`relative rounded-lg overflow-hidden shadow-sm border-2 transition-all ${isCollected ? "border-green-500 bg-green-50" : "border-white bg-white"
                  } ${devMode && !isCollected && !isFree ? "cursor-pointer hover:border-purple-500 hover:scale-105" : ""}`}
              >
                {isFree ? (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xs text-center p-1">
                    FREE
                  </div>
                ) : cellUser ? (
                  <>
                    <img
                      src={cellUser.photoURL || `https://ui-avatars.com/api/?name=${cellUser.displayName}`}
                      alt={cellUser.displayName}
                      className={`w-full h-full object-cover ${isCollected ? "opacity-100" : "opacity-50 grayscale"}`}
                    />
                    {isCollected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                        <span className="text-green-600 font-bold text-xl">✓</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={() => {
            if (confirm("Är du säker? Detta nollställer din nuvarande bricka.")) {
              createBoard();
            }
          }}
          disabled={creating}
          className="text-sm text-gray-500 underline hover:text-red-600 disabled:opacity-50"
        >
          {creating ? "Skapar..." : "Slumpa ny bricka"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 shadow-lg z-20">
        <div className="flex justify-around max-w-md mx-auto">
          <Link href="/id" className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600">
            <QrCode className="w-6 h-6" />
            <span className="text-xs">My ID</span>
          </Link>

          <Link href="/scan" className="flex flex-col items-center gap-1 -mt-8">
            <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
              <Scan className="w-8 h-8" />
            </div>
            <span className="text-xs font-medium text-blue-600">Scan</span>
          </Link>

          <button onClick={() => auth.signOut()} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600">
            <img src={userProfile?.photoURL || user?.photoURL || ""} className="w-6 h-6 rounded-full" alt="Profile" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      {/* Debug / Seed Button */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setDevMode(!devMode)}
          className={`text-xs px-3 py-1 rounded-full shadow-lg transition-colors ${devMode ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700"}`}
        >
          {devMode ? "Dev Mode: ON" : "Dev Mode: OFF"}
        </button>
        {allUsers.length < 5 && (
          <button
            onClick={async () => {
              if (confirm("Vill du skapa 25 låtsas-kollegor?")) {
                const { seedUsers } = await import("@/lib/seed");
                await seedUsers();
                window.location.reload();
              }
            }}
            className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg hover:bg-purple-700"
          >
            + Add Dummy Users
          </button>
        )}

      </div>
    </main>
  );
}

