import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // An array of public routes that don't require authentication.
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/policy",
    "/tos",
    "/icon.png",
    "/icon-large.png",
    "/opengraph-image.png", // Common image for social sharing
    "/twitter-image.png", // Common image for Twitter sharing
    "/api/health", // Example public API route for health checks
  ],

  // An array of routes to ignore, such as for static assets.
  // ignoredRoutes: ["/((?!api|trpc))(_next.*|.+_static|_vercel|[\\w-]+\\.\\w+)"],
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
