"use client";

import SubLink from "../ui/Sublink";
import { usePathname } from "next/navigation";
import {ROUTES} from "@/contents/routes";
import {Book} from "lucide-react";

export default function WikiMenu({ isSheet = false }) {
  const pathname = usePathname();
  if (!pathname.startsWith("/wiki")) return null;

  return (
      <div className={'px-2'}>
      {isSheet && (
          <div className="flex items-center gap-2 mb-3 text-blue-500">
              <Book className="w-4 h-4" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Документация</h2>
          </div>
      )}
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
  );
}
