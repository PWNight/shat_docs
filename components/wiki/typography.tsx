import { PropsWithChildren } from "react";

export function Typography({ children }: PropsWithChildren) {
    return (
        <div className="
              prose prose-zinc dark:prose-invert
              max-w-none w-full
              prose-headings:scroll-m-20
              prose-code:before:content-none prose-code:after:content-none
              prose-pre:p-0
              prose-img:rounded-xl prose-img:border
              selection:bg-primary/10
              pt-2
        ">
            {children}
        </div>
    );
}