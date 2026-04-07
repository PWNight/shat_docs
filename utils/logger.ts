type LogContext = Record<string, unknown>;

function formatContext(context?: LogContext) {
    if (!context) return undefined;
    return { ...context, timestamp: new Date().toISOString() };
}

export const logger = {
    info(message: string, context?: LogContext) {
        console.info(message, formatContext(context));
    },
    warn(message: string, context?: LogContext) {
        console.warn(message, formatContext(context));
    },
    error(message: string, context?: LogContext) {
        console.error(message, formatContext(context));
    },
    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV !== "production") {
            console.debug(message, formatContext(context));
        }
    },
};
