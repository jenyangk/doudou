import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)", // Match /sign-in and /sign-in/...
  "/sign-up(.*)", // Match /sign-up and /sign-up/...
  "/policy",
  "/tos",
  "/icon.png",
  "/icon-large.png",
  "/opengraph-image.png",
  "/twitter-image.png",
  "/api/health",
  // Add any other specific public files or API routes here, e.g. /api/webhooks/(.*)
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // Use auth directly, not auth()
  }
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
