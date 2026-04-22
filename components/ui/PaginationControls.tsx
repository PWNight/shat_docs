"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

type PaginationControlsProps = {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
};

export default function PaginationControls({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    className,
}: PaginationControlsProps) {
    if (totalItems <= itemsPerPage) return null;

    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const goToPage = (page: number) => onPageChange(Math.max(1, Math.min(page, totalPages)));

    return (
        <div className={`flex items-center justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide ${className || ""}`}>
            <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl shrink-0 h-9 w-9"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1 shrink-0">
                {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                        return (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                                className="w-9 h-9 rounded-xl shrink-0"
                            >
                                {pageNum}
                            </Button>
                        );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="px-1 text-muted-foreground">...</span>;
                    }
                    return null;
                })}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl shrink-0 h-9 w-9"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    );
}
