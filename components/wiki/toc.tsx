import { getWikiTocs } from "@/utils/markdown";
import TocObserver from "./toc-observer";
import { ScrollArea } from "@/components/ui/ScrollArea";

export default async function Toc({ path }: { path: string }) {
  const tocs = await getWikiTocs(path);

  return (
    <div className="lg:flex hidden toc flex-[1.5] min-w-[238px] py-6 h-[96.95vh]">
      <div className="flex flex-col gap-3 w-full pl-2">
        <h3 className="font-semibold text-sm">На этой странице:</h3>
        <ScrollArea className="pb-2 pt-0.5 overflow-y-auto">
          <TocObserver data={tocs} />
        </ScrollArea>
      </div>
    </div>
  );
}
