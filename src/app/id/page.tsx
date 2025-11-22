"use client";

import { useAuth } from "@/components/AuthProvider";
import QRCode from "react-qr-code";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MyIDPage() {
    const { user, userProfile } = useAuth();

    if (!user || !userProfile) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-white relative">
            <Link href="/" className="absolute top-4 left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ArrowLeft className="w-6 h-6" />
            </Link>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 drop-shadow-md">Din Kod</h1>
                <p className="text-white/80 text-lg">Visa denna för en kollega!</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <div className="w-64 h-64">
                    <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={userProfile.slackId || user.uid}
                        viewBox={`0 0 256 256`}
                    />
                </div>
            </div>

            <div className="mt-8 flex items-center gap-4 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                <img src={userProfile.photoURL || user.photoURL || ""} className="w-12 h-12 rounded-full border-2 border-accent" alt="Profile" />
                <span className="font-semibold text-xl">{userProfile.displayName}</span>
            </div>
        </div>
    );
}
