import { Outlet, Link } from "@tanstack/solid-router";
import { Toaster } from "solid-toast";
import { Profile } from "../components/Profile";

export function RootLayout() {
  return (
    <div class="flex flex-col min-h-screen">
      <header class="sticky top-0 flex h-12 items-center gap-4 border-b bg-white px-4 md:px-6 justify-between z-50">
        <Link to="/" class="hover:opacity-80">
          <img src="/icon.png" alt="DouDou" width={32} height={32} />
        </Link>
        <Profile />
      </header>

      <main class="flex-1">
        <Outlet />
      </main>

      <footer class="border-t py-4 px-4 md:px-6">
        <div class="max-w-sm mx-auto flex justify-center gap-4 text-sm text-gray-500">
          <Link to="/tos" class="hover:text-gray-900 transition-colors">
            Terms of Service
          </Link>
          <Link to="/policy" class="hover:text-gray-900 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>

      <Toaster position="bottom-center" />
    </div>
  );
}
