"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { env } from "@/env";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        // Log error to console in development
        if (env.NODE_ENV === "development") {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
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

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <div className="max-w-md w-full">
                        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-destructive/10 rounded-full">
                                    <AlertCircle className="w-12 h-12 text-destructive" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Что-то пошло не так
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу.
                                    </p>
                                </div>

                                {env.NODE_ENV === "development" && this.state.error && (
                                    <div className="w-full text-left">
                                        <details className="bg-muted rounded-lg p-4">
                                            <summary className="cursor-pointer text-sm font-medium text-foreground mb-2">
                                                Детали ошибки (только для разработки)
                                            </summary>
                                            <pre className="text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">
                                                {this.state.error.toString()}
                                                {this.state.errorInfo?.componentStack}
                                            </pre>
                                        </details>
                                    </div>
                                )}

                                <button
                                    onClick={this.handleReset}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Попробовать снова
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
