import { PropsWithChildren } from "react";
import {NavProfile} from "@/components/NavProfile";

export default function ProfileLayout({ children }: PropsWithChildren) {
    return (
            <div className="grid sm:grid-cols-[250px_1fr] gap-6 lg:w-[95%] w-full mx-auto">
            <NavProfile/>
            {children}
        </div>
    );
}
