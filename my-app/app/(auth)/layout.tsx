import Prism from "@/components/ui/Prism";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative w-full h-screen overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                 <Prism
                    animationType="rotate"
                    timeScale={0.5}
                    height={3.5}
                    baseWidth={5.5}
                    scale={3.6}
                    hueShift={0}
                    colorFrequency={1}
                    noise={0}
                    glow={1}
                 />
            </div>
            <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none overflow-y-auto">
                <div className="pointer-events-auto w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
