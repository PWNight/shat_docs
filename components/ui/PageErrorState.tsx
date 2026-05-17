"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, DatabaseZap, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/utils/functions";

export type PageErrorKind = "db" | "network" | "generic";

type Props = {
    title: string;
    description?: string;
    kind?: PageErrorKind;
    actionLabel?: string;
    onAction?: () => void;
    details?: string;
    className?: string;
};

export default function PageErrorState({
    title,
    description,
    kind = "generic",
    actionLabel = "Повторить",
    onAction,
    details,
    className,
}: Props) {
    const icon =
        kind === "db" ? <DatabaseZap className="h-5 w-5" /> :
        kind === "network" ? <WifiOff className="h-5 w-5" /> :
        <AlertTriangle className="h-5 w-5" />;

    const accent =
        kind === "db" ? "text-destructive bg-destructive/10 border-destructive/25" :
        kind === "network" ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25" :
        "text-muted-foreground bg-muted/40 border-border";

    return (
        <div className={cn("min-h-[70vh] flex items-center justify-center p-6", className)}>
            <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn("h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0", accent)}>
                            {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                {title}
                            </h2>
                            {description ? (
                                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                    {description}
                                </p>
                            ) : null}
                            {details ? (
                                <p className="mt-3 text-xs text-muted-foreground break-words">
                                    {details}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {onAction ? (
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onAction}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                {actionLabel}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

type BoundaryProps = {
    children: ReactNode;
    fallback?: ReactNode;
};

type BoundaryState = {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
};

export class PageErrorBoundary extends Component<BoundaryProps, BoundaryState> {
    constructor(props: BoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): BoundaryState {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ error, errorInfo });

        if (process.env.NODE_ENV === "development") {
            console.error("PageErrorBoundary caught an error:", error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const devDetails =
                process.env.NODE_ENV === "development" && this.state.error
                    ? [
                          this.state.error.toString(),
                          this.state.errorInfo?.componentStack,
                      ]
                          .filter(Boolean)
                          .join("\n")
                    : undefined;

            return (
                <PageErrorState
                    kind="generic"
                    className="min-h-screen"
                    title="Что-то пошло не так"
                    description="Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу."
                    details={devDetails}
                    actionLabel="Попробовать снова"
                    onAction={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}
