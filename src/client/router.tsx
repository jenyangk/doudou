import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/solid-router";
import { lazy } from "solid-js";
import { RootLayout } from "./routes/__root";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const Home = lazy(() => import("./routes/index"));
const SignIn = lazy(() => import("./routes/sign-in"));
const SessionBoard = lazy(() => import("./routes/sessions/$code"));
const SessionResults = lazy(() => import("./routes/sessions/$code.results"));
const ToS = lazy(() => import("./routes/tos"));
const Policy = lazy(() => import("./routes/policy"));

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
