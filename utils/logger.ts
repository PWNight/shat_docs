import fs from "fs";
import path from "path";

type LogContext = Record<string, unknown>;

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

let logFileReady = false;

function ensureLogDir(): void {
    if (logFileReady) return;
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        logFileReady = true;
    } catch {
        // If we can't create the log dir, we'll just log to console
    }
}

function formatLogLine(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${ctx}\n`;
}

function writeToFile(line: string): void {
    ensureLogDir();
    if (!logFileReady) return;
    try {
        fs.appendFileSync(LOG_FILE, line, "utf-8");
    } catch {
        // Silently fail file writes to avoid cascading errors
    }
}

function formatContext(context?: LogContext) {
    if (!context) return undefined;
    return { ...context, timestamp: new Date().toISOString() };
}

export const logger = {
    info(message: string, context?: LogContext) {
        console.info(message, formatContext(context));
        writeToFile(formatLogLine("INFO", message, context));
    },
    warn(message: string, context?: LogContext) {
        console.warn(message, formatContext(context));
        writeToFile(formatLogLine("WARN", message, context));
    },
    error(message: string, context?: LogContext) {
        console.error(message, formatContext(context));
        writeToFile(formatLogLine("ERROR", message, context));
    },
    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV !== "production") {
            console.debug(message, formatContext(context));
        }
        writeToFile(formatLogLine("DEBUG", message, context));
    },
};
