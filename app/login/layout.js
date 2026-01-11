export const metadata = {
    title: "Login - MintMart",
    description: "Secure Login for Account Manager",
};

export default function LoginLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
