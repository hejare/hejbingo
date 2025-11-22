"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export function BingoOverlay({ onComplete }: { onComplete: () => void }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Fire confetti
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();

        // Hide after animation
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete();
        }, duration + 1000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="text-center animate-bounce">
                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-lg">
                    BINGO!
                </h1>
                <p className="text-white text-2xl mt-4 font-bold">Grattis! 🎉</p>
            </div>
        </div>
    );
}
