"use client";

import { cn } from "@/utils/functions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps } from "react";

type AnchorProps = ComponentProps<typeof Link> & {
    absolute?: boolean;
    activeClassName?: string;
    disabled?: boolean;
};

export default function Anchor({
                                      absolute,
                                      className = "",
                                      activeClassName = "",
                                      disabled,
                                      children,
                                      ...props
                                  }: AnchorProps) {
    const path = usePathname();
    let isMatch = absolute
        ? props.href.toString() === path
        : path === props.href;

    if (props.href.toString().includes("http")) isMatch = false;

    if (disabled)
        return (
            <div className={cn(className, "cursor-not-allowed")}>{children}</div>
        );
    return (
        <Link className={cn(className, isMatch && activeClassName)} {...props}>
            {children}
        </Link>
    );
}
