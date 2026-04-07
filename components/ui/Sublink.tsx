import Anchor from "./Anchor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import { cn } from "@/utils/functions";
import { SheetClose } from "@/components/ui/Sheet";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {EachRoute} from "@/contents/routes";

export default function SubLink({
  title,
  href,
  items,
  noLink,
  level,
  isSheet,
}: EachRoute & { level: number; isSheet: boolean }) {
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(level == 0);

  useEffect(() => {
    if (path == href || path.includes(href)) setIsOpen(true);
  }, [href, path]);

  const Comp = (
    <Anchor
      className={cn(
        "group/link relative flex w-full items-start rounded-lg px-3 py-2 text-[15px] leading-5 text-foreground/80 transition-all duration-200",
        "hover:bg-muted/70 hover:text-foreground"
      )}
      activeClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
      href={href}
    >
      <span className="block whitespace-normal break-words">{title}</span>
    </Anchor>
  );

  const titleOrLink = !noLink ? (
    isSheet ? (
      <SheetClose asChild>{Comp}</SheetClose>
    ) : (
      Comp
    )
  ) : (
    <h4 className="px-3 py-2 text-sm font-semibold text-primary">{title}</h4>
  );

  if (!items) {
    return <div className="flex flex-col">{titleOrLink}</div>;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-foreground/80 transition-colors hover:bg-muted/70 hover:text-foreground">
            {titleOrLink}
            <span className="text-muted-foreground">
              {!isOpen ? (
                <ChevronRight className="h-[0.9rem] w-[0.9rem]" />
              ) : (
                <ChevronDown className="h-[0.9rem] w-[0.9rem]" />
              )}
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className={cn(
              "mt-1 flex flex-col items-start gap-1",
              level > 0 && "ml-2 border-l border-border/70 pl-2"
            )}
          >
            {items?.map((innerLink) => {
              const modifiedItems = {
                ...innerLink,
                href: `${href + innerLink.href}`,
                level: level + 1,
                isSheet,
              };
              return <SubLink key={modifiedItems.href} {...modifiedItems} />;
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
