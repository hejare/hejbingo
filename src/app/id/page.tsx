"use client";

import { useAuth } from "@/components/AuthProvider";
import QRCode from "react-qr-code";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MyIDPage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-4 text-white relative">
            <Link href="/" className="absolute top-4 left-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Din Kod</h1>
                <p className="text-blue-100">Visa denna för en kollega!</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl">
                <div className="w-64 h-64">
                    <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={user.uid}
                        viewBox={`0 0 256 256`}
                    />
                </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
                <img src={user.photoURL || ""} className="w-12 h-12 rounded-full border-2 border-white" alt="Profile" />
                <span className="font-semibold text-xl">{user.displayName}</span>
            </div>
        </div>
    );
}
