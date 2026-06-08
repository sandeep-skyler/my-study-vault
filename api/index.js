// Vercel serverless entry-point.
// Imports the pre-built, self-contained Express handler bundle produced by esbuild.
export { default } from '../artifacts/api-server/dist/handler.mjs';
