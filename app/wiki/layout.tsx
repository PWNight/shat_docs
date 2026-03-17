import {Leftbar} from "@/components/LeftBar";
import React from "react";

export default function WikiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <div className="flex items-start gap-6 sm:gap-8 sm:px-8">
            <Leftbar key="leftbar" />
            <main className="w-full">{children}</main>
        </div>
    );
}
