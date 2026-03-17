import { getPreviousNext } from "@/utils/markdown";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/Button";

export default function Pagination({ pathname }: { pathname: string }) {
  const res = getPreviousNext(pathname);

  return (
    <div className="grid sm:grid-cols-2 grow sm:py-10 py-7 gap-3">
      <div>
        {res.prev && (
          <Link
            className={buttonVariants({
              variant: "outline",
              className:
                "no-underline w-full flex flex-col pl-3 py-8! items-start!",
            })}
            href={`/wiki${res.prev.href}`}
          >
            <span className="flex items-center text-muted-foreground text-xs">
              <ChevronLeftIcon className="w-[1rem] h-[1rem] mr-1" />
              Предыдущее
            </span>
            <span className="mt-1 ml-1 w-full text-wrap"> {/* Key change: break-words */}
              {res.prev.title}
            </span>
          </Link>
        )}
      </div>
      <div>
        {res.next && (
          <Link
            className={buttonVariants({
              variant: "outline",
              className:
                "no-underline w-full flex flex-col pr-3 py-8! items-end!",
            })}
            href={`/wiki${res.next.href}`}
          >
            <span className="flex items-center text-muted-foreground text-xs">
              Следующее
              <ChevronRightIcon className="w-[1rem] h-[1rem] ml-1" />
            </span>
            <span className="mt-1 ml-1 w-full text-wrap text-end"> {/* Key change: break-words */}
              {res.next.title}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}