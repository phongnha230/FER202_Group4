"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <Header />
            <main className="min-h-screen pl-64 pt-16">
                <div className="p-6 md:p-8">{children}</div>
            </main>
        </div>
    );
}
