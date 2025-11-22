"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useGame } from "@/hooks/useGame";
import { Scanner } from "@yudiel/react-qr-scanner";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkBingo } from "@/lib/game-logic";

export default function ScanPage() {
    const { user } = useAuth();
    const { gameState } = useGame();
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
    const [paused, setPaused] = useState(false);

    const handleScan = async (result: string) => {
        if (paused || !user || !gameState) return;

        // Basic validation (is it a UID?)
        if (!result || result.length < 5) return;

        setPaused(true);

        // Check if already collected
        if (gameState.collectedUids.includes(result)) {
            setScanResult({ success: false, message: "Redan tagen!" });
            return;
        }

        // Check if on board
        if (!gameState.board.includes(result)) {
            setScanResult({ success: false, message: "Inte på din bricka tyvärr!" });
            return;
        }

        // Update Firestore
        try {
            const gameRef = doc(db, "game_states", user.uid);
            const newCollected = [...gameState.collectedUids, result];
            const isBingo = checkBingo(gameState.board, newCollected);

            await updateDoc(gameRef, {
                collectedUids: arrayUnion(result),
                isBingo: isBingo,
                lastUpdated: Date.now()
            });

            setScanResult({ success: true, message: isBingo ? "BINGO!!!" : "Träff!" });
        } catch (e) {
            console.error(e);
            setScanResult({ success: false, message: "Kunde inte spara..." });
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setPaused(false);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col relative">
            <Link href="/" className="absolute top-4 left-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>

            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                {!scanResult ? (
                    <div className="w-full h-full max-w-md mx-auto relative">
                        <Scanner
                            onScan={(result) => result[0] && handleScan(result[0].rawValue)}
                            components={{ onOff: false, torch: false, zoom: false, finder: true }}
                            styles={{ container: { width: "100%", height: "100%" } }}
                        />
                        <div className="absolute bottom-20 left-0 right-0 text-center text-white/80 text-sm pointer-events-none">
                            Peka kameran mot en kollegas QR-kod
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center z-30 animate-in fade-in zoom-in duration-300">
                        {scanResult.success ? (
                            <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
                        ) : (
                            <XCircle className="w-24 h-24 text-red-500 mb-4" />
                        )}
                        <h2 className="text-3xl font-bold text-white mb-2">{scanResult.message}</h2>
                        <button
                            onClick={resetScan}
                            className="mt-8 bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            Scanna igen
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
