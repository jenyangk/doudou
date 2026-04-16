import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
  type RouteComponent,
} from "@tanstack/solid-router";
import { lazy } from "solid-js";
import { RootLayout } from "./routes/__root";

const lazyRoute = (fn: () => Promise<{ default: () => any }>) =>
  lazy(fn) as unknown as RouteComponent;

const rootRoute = createRootRoute({
  component: RootLayout,
});

const Home = lazyRoute(() => import("./routes/index"));
const SignIn = lazyRoute(() => import("./routes/sign-in"));
const SessionBoard = lazyRoute(() => import("./routes/sessions/$code"));
const SessionResults = lazyRoute(() => import("./routes/sessions/$code.results"));
const ToS = lazyRoute(() => import("./routes/tos"));
const Policy = lazyRoute(() => import("./routes/policy"));

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignIn,
});

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$code",
  component: SessionBoard,
});

const sessionResultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$code/results",
  component: SessionResults,
});

const tosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tos",
  component: ToS,
});

const policyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/policy",
  component: Policy,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  sessionRoute,
  sessionResultsRoute,
  tosRoute,
  policyRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

export function Router() {
  return <RouterProvider router={router} />;
}
