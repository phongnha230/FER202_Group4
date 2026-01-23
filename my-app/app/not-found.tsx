import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center space-y-6">
                <h1 className="text-9xl font-bold text-muted-foreground/30">404</h1>
                <h2 className="text-3xl font-bold">Page Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Sorry, we could not find the page you were looking for.
                    It might have been moved or deleted.
                </p>
                <Button asChild className="btn-primary">
                    <Link href="/">
                        <Home className="h-4 w-4 mr-2" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
