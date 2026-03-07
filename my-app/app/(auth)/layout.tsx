export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative w-full h-screen overflow-hidden bg-white">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_42%),radial-gradient(circle_at_80%_25%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(2,6,23,0.18),transparent_46%)]" />
            <div className="absolute -top-20 -left-16 z-0 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
            <div className="absolute bottom-0 right-0 z-0 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
            <div className="absolute inset-0 z-0 bg-white/70" />
            <div className="absolute inset-0 z-0">
                <div className="h-full w-full bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
            </div>
            <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none overflow-y-auto">
                <div className="pointer-events-auto w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
