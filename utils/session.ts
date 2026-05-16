// Backward compatibility re-exports
// For server-side code, import from session.server
// For client-side code, import from session.client
// Types are in session.types

export type { SessionPayload, SessionListItem } from "./session.types";

// Re-export server functions for backward compatibility
export {
    encryptSession,
    decryptSession,
    createSession,
    deleteSession,
    getSession,
    verifySessionFromToken,
    revokeSessionById,
    revokeAllUserSessions,
    listUserSessions,
    listAllActiveSessions,
    listAllSessions,
} from "./session.server";