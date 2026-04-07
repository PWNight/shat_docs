import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/Breadcrumb";
import { Fragment } from "react";
import Link from "next/link";

export default function WikiBreadcrumb({ paths }: { paths: string[] }) {
  return (
      <div className="pb-5">
        <Breadcrumb className="overflow-x-auto">
          <BreadcrumbList className="w-max flex-nowrap rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs sm:text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/wiki">Wiki</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {paths.map((path, index) => (
                <Fragment key={path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index < paths.length - 1 ? (
                        <BreadcrumbLink asChild>
                          <Link href={`/wiki/${paths.slice(0, index + 1).join("/")}`}>
                          {toTitleCase(path)}
                          </Link>
                        </BreadcrumbLink>
                    ) : (
                        <BreadcrumbPage>
                          {toTitleCase(path)}
                        </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
  );
}

function toTitleCase(input: string): string {
  const words = input.split("-");
  const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );
  return capitalizedWords.join(" ");
}
