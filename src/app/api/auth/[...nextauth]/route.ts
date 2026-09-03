import { handlers } from "@/auth";

// Delegates all /api/auth/* requests (sign-in, sign-out, session, csrf, ...)
// to Auth.js's built-in handlers.
export const { GET, POST } = handlers;
