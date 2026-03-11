import { PropsWithChildren } from "react";
import { NavProfile } from "@/components/NavProfile";

export default function ProfileLayout({ children }: PropsWithChildren) {
    return (
        // Изменил sm:grid-cols на lg:grid-cols, чтобы на мобилках (до 1024px)
        // навигация и контент шли друг под другом (stack)
        <div className="flex flex-col lg:grid lg:grid-cols-[250px_minmax(0,1fr)] gap-4 sm:gap-6 px-2 sm:px-4 w-full mx-auto my-4 overflow-hidden">
            <aside className="w-full lg:w-[250px]">
                <NavProfile />
            </aside>
            <main className="min-w-0 w-full">
                {children}
            </main>
        </div>
    );
}