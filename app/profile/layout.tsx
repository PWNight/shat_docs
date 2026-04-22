import { PropsWithChildren } from "react";

export default function ProfileLayout({ children }: PropsWithChildren) {
    return (
        <div className="mx-auto w-[90%] sm:w-[80%] py-6 overflow-hidden">
            <main className=" w-full">
                {children}
            </main>
        </div>
    );
}