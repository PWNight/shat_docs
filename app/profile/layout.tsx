import { PropsWithChildren } from "react";
import { NavProfile } from "@/components/NavProfile";

export default function ProfileLayout({ children }: PropsWithChildren) {
    return (
        <div className="grid sm:grid-cols-[250px_minmax(0,1fr)] gap-6 lg:px-4 w-full mx-auto mb-4 mt-4 overflow-hidden">
            <NavProfile />
            <main className="min-w-0">
                {children}
            </main>
        </div>
    );
}