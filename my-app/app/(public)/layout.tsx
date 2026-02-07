import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ChatWidget from '@/components/chat/ChatWidget';

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
            <ChatWidget />
        </>
    );
}
