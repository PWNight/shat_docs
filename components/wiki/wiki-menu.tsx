"use client";

import SubLink from "../ui/Sublink";
import { usePathname } from "next/navigation";
import {ROUTES} from "@/contents/routes";
import {Book} from "lucide-react";

export default function WikiMenu({ isSheet = false }) {
  const pathname = usePathname();
  if (!pathname.startsWith("/wiki")) return null;

  return (
      <div className="">
      {isSheet && (
          <section className="px-2 pb-2">
            <div className="space-y-1">
              <div className="mb-2 flex items-center gap-2 text-blue-500">
                <Book className="h-4 w-4" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Документация</h2>
              </div>
            </div>
          </section>
      )}
      <div className="flex flex-col gap-0.5">
        {ROUTES.map((item, index) => {
          const modifiedItems = {
            ...item,
            href: `/wiki${item.href}`,
            level: 0,
            isSheet,
          };
          return <SubLink key={item.title + index} {...modifiedItems} />;
        })}
      </div>
      </div>
  );
}
