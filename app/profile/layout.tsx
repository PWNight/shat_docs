import { PropsWithChildren } from "react";
import { NavProfile } from "@/components/NavProfile";

export default function ProfileLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[250px_minmax(0,1fr)] gap-4 sm:gap-6 sm:px-4 px-2 w-full mx-auto my-4 overflow-hidden">
            <aside className="w-full lg:w-62.5">
                <NavProfile />
            </aside>
            <main className="min-w-0 w-full">
                {children}
            </main>
        </div>
    );
}