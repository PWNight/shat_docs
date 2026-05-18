import { useCallback, useState } from "react";

export function useAccessibleTabs<T extends string>(
    tabs: readonly T[],
    initialTab: T,
    idPrefix: string
) {
    const [activeTab, setActiveTab] = useState<T>(initialTab);
    const [visitedTabs, setVisitedTabs] = useState<Set<T>>(() => new Set([initialTab]));

    const selectTab = useCallback((tab: T) => {
        setActiveTab(tab);
        setVisitedTabs((prev) => {
            if (prev.has(tab)) return prev;
            const next = new Set(prev);
            next.add(tab);
            return next;
        });
    }, []);

    const handleTabKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLButtonElement>, tab: T) => {
            const index = tabs.indexOf(tab);
            if (index === -1) return;

            let nextIndex: number | null = null;
            if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
            if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = tabs.length - 1;
            if (nextIndex === null) return;

            event.preventDefault();
            const nextTab = tabs[nextIndex];
            selectTab(nextTab);
            document.getElementById(`${idPrefix}-tab-${nextTab}`)?.focus();
        },
        [idPrefix, selectTab, tabs]
    );

    return {
        activeTab,
        visitedTabs,
        selectTab,
        handleTabKeyDown,
    };
}
