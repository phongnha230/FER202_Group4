import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SearchResults from "./SearchResults";

export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="py-10 md:py-12">
                <div className="container-custom page-container flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </main>
        }>
            <SearchResults />
        </Suspense>
    );
}
