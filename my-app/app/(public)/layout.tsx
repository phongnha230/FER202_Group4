import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ChatWidgetLoader from '@/components/chat/ChatWidgetLoader';

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
            <ChatWidgetLoader />
        </>
    );
}

