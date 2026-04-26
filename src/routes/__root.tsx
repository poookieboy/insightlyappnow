import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "StudentSync — Study smarter" },
      { name: "description", content: "StudentSync helps students manage tasks, revise with real questions, organize notes and stay motivated." },
      { name: "author", content: "StudentSync" },
      { property: "og:title", content: "StudentSync — Study smarter" },
      { property: "og:description", content: "StudentSync helps students manage tasks, revise with real questions, organize notes and stay motivated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "StudentSync — Study smarter" },
      { name: "twitter:description", content: "StudentSync helps students manage tasks, revise with real questions, organize notes and stay motivated." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/95c03340-1d09-44e8-8ccd-143e1bfd6d9e/id-preview-b1da8f5d--d3bf1b54-c03c-4c98-a378-242e83c39f8e.lovable.app-1777230584723.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/95c03340-1d09-44e8-8ccd-143e1bfd6d9e/id-preview-b1da8f5d--d3bf1b54-c03c-4c98-a378-242e83c39f8e.lovable.app-1777230584723.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-center" richColors />
    </>
  );
}
