import { Outlet, Link } from "@tanstack/solid-router";
import { Toaster } from "solid-toast";
import { Header } from "../components/Header";

export function RootLayout() {
  return (
    <div class="flex flex-col min-h-screen bg-dd-surface">
      <Header />

      <main class="flex-1">
        <Outlet />
      </main>

      <footer class="border-t-2 border-dd-muted-border py-4 px-4 md:px-6 bg-white">
        <div class="max-w-sm mx-auto flex justify-center gap-4 text-sm font-body text-dd-text-muted">
          <Link to="/tos" class="hover:text-dd-primary transition-colors">
            Terms of Service
          </Link>
          <Link to="/policy" class="hover:text-dd-primary transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>

      <Toaster position="bottom-center" />
    </div>
  );
}
