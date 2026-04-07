import { PropsWithChildren } from "react";

export default function ProfileLayout({ children }: PropsWithChildren) {
    return (
        <div className="px-4 w-full mx-auto my-4 overflow-hidden">
            <main className="min-w-0 w-full">
                {children}
            </main>
        </div>
    );
}