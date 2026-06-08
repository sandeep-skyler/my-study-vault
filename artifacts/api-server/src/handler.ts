/**
 * Vercel serverless handler.
 * Exports the Express app without calling app.listen() and without
 * Replit-specific middleware (Clerk proxy, pino-http).
 *
 * Required environment variables on Vercel:
 *   CLERK_SECRET_KEY      — Clerk secret key
 *   CLERK_PUBLISHABLE_KEY — Clerk publishable key
 *   DATABASE_URL          — PostgreSQL connection string
 */
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Clerk middleware — reads CLERK_SECRET_KEY + CLERK_PUBLISHABLE_KEY from env
app.use(clerkMiddleware());

app.use("/api", router);

export default app;
