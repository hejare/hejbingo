"use client";

import { useAuth } from "@/components/AuthProvider";
import { useGame } from "@/hooks/useGame";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { Scan, QrCode, Trophy } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { gameState, allUsers, loading } = useGame();

  if (loading || !gameState) return <div className="h-screen flex items-center justify-center">Loading game...</div>;

  const getUser = (uid: string) => allUsers.find(u => u.uid === uid);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
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
                className={`relative rounded-lg overflow-hidden shadow-sm border-2 transition-all ${isCollected ? "border-green-500 bg-green-50" : "border-white bg-white"
                  }`}
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
            <img src={user?.photoURL || ""} className="w-6 h-6 rounded-full" alt="Profile" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      {/* Debug / Seed Button */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
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

        <button
          onClick={async () => {
            if (confirm("Vill du synka från Google Workspace?")) {
              try {
                const res = await fetch("/api/sync", { method: "POST" });
                const data = await res.json();
                if (data.success) {
                  alert(`Synkade ${data.count} användare!`);
                  window.location.reload();
                } else {
                  alert("Kunde inte synka: " + (data.error || "Okänt fel"));
                }
              } catch (e) {
                alert("Fel vid anrop till sync");
              }
            }
          }}
          className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-lg hover:bg-blue-700"
        >
          ↻ Sync Directory
        </button>
      </div>
    </main>
  );
}

