import { PropsWithChildren } from "react";

export default function ProfileLayout({ children }: PropsWithChildren) {
    return (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
            <main className="min-w-0 w-full">
                {children}
            </main>
        </div>
    );
}