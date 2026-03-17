import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { Logo, NavMenu } from "./NavMain";
import { AlignLeftIcon } from "lucide-react";
import { FooterButtons } from "./Footer";
import { DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import WikiMenu from "@/components/wiki/wiki-menu";

export function Leftbar() {
  return (
      <aside className="md:flex hidden w-[260px] flex-col overflow-y-auto">
        <ScrollArea className="py-6 text-base">
          <h2 className="text-xs font-semibold text-muted-foreground mb-5 uppercase tracking-wider">
            Содержание
          </h2>
          <div className="flex flex-col gap-2">
            <WikiMenu />
          </div>
        </ScrollArea>
      </aside>
  );
}

export function SheetLeftbar() {
  return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex hover:bg-muted/80 transition-colors rounded-full p-2"
          >
            <AlignLeftIcon className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
            className="flex flex-col gap-6 px-0 w-[280px] bg-background/95 backdrop-blur-sm border-r border-muted/20"
            side="left"
        >
          <DialogTitle className="sr-only">Меню</DialogTitle>
          <SheetHeader>
            <SheetClose
                className="px-6 py-3 hover:bg-muted/50 rounded-r-full transition-all duration-200"
                asChild
            >
              <Logo />
            </SheetClose>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4 px-6 py-4">
              <h1 className="text-lg font-semibold text-foreground/90 pb-2">
                Навигация
              </h1>
              <NavMenu isSheet /> {/* Уже использует новый стиль выделения */}
            </div>
            <div className="flex flex-col gap-4 px-6 py-4">
              <WikiMenu isSheet />
            </div>
            <div className="flex flex-col gap-3 px-6 py-4 mt-auto border-t border-muted/20">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Социальные сети
              </h2>
              <FooterButtons />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
  );
}