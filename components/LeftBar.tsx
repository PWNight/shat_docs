import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { Logo, NavMenu } from "./NavMain";
import { AlignLeftIcon, LayoutGrid, Book, Share2 } from "lucide-react";
import { FooterButtons } from "./Footer";
import { DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import WikiMenu from "@/components/wiki/wiki-menu";
import { ModeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/AccountButton";

export function Leftbar() {
  return (
      <aside className="md:flex hidden w-[260px] flex-col overflow-y-auto sticky top-20 h-[calc(100vh-5rem)]">
        <ScrollArea className="py-2 text-base">
          <div className="flex items-center gap-2 px-2 mb-4 text-blue-500">
            <Book className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Содержание
            </h2>
          </div>
          <div className="flex flex-col gap-1">
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
            className="flex flex-col gap-0 px-0 w-[300px] sm:w-[340px] bg-background border-r border-border shadow-2xl"
            side="left"
        >
          <DialogTitle className="sr-only">Навигационное меню</DialogTitle>

          <SheetHeader className="px-6 py-4 border-b border-border bg-muted/5">
            <SheetClose asChild>
              <Logo />
            </SheetClose>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="flex flex-col gap-8 py-6">

              <section>
                <div className="flex items-center gap-2 px-2 mb-3 text-blue-500">
                  <LayoutGrid className="w-4 h-4" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Меню</h2>
                </div>
                <NavMenu isSheet />
              </section>

              <section>
                <div className="space-y-1">
                  <WikiMenu isSheet />
                </div>
              </section>

              <section className="pb-4">
                <div className="flex items-center gap-2 px-2 mb-3 text-muted-foreground">
                  <Share2 className="w-4 h-4" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Сообщество</h2>
                </div>
                <div className="p-1 bg-muted/30 rounded-xl border border-border/50">
                  <FooterButtons />
                </div>
              </section>

            </div>
          </ScrollArea>

          <div className="mt-auto border-t border-border p-4 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between px-2 py-1 bg-background border border-border rounded-lg shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Оформление</span>
              <ModeToggle />
            </div>
            <div className="w-full">
              <AuthButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
  );
}