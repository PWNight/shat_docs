"use client";

import SubLink from "../ui/Sublink";
import { usePathname } from "next/navigation";
import {ROUTES} from "@/contents/routes";

export default function WikiMenu({ isSheet = false }) {
  const pathname = usePathname();
  if (!pathname.startsWith("/wiki")) return null;

  return (
      <>
      {isSheet && (
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Вики</h2>
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
      </>
  );
}
