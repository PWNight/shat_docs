import { getWikiTocs } from "@/utils/markdown";
import TocObserver from "./toc-observer";
import { ScrollArea } from "@/components/ui/ScrollArea";

export default async function Toc({ path }: { path: string }) {
  const tocs = await getWikiTocs(path);
  if (!tocs.length) return null;

  return (
    <div className="toc w-full py-2 lg:py-0">
      <div className="flex w-full flex-col gap-3">
        <h3 className="font-semibold text-sm">На этой странице:</h3>
        <ScrollArea className="max-h-48 lg:max-h-[calc(100vh-11rem)] pb-1 pt-0.5 overflow-y-auto">
          <TocObserver data={tocs} />
        </ScrollArea>
      </div>
    </div>
  );
}
