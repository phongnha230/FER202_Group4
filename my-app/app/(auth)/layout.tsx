export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Since the auth pages have their own "header" elements (Logo, Login link etc),
    // and presumably we want to isolate them or they are just children of likely the root layout.
    // We just render children here.
    return (
        <>
            {children}
        </>
    );
}
