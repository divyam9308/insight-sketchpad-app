import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fyndbridge ATS" },
      { name: "description", content: "Fyndbridge ATS dashboard" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to Fyndbridge.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/performance">
          <Card className="transition hover:shadow-md hover:border-primary/40">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Performance Review</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Track allocation, work done, feedback and weighted ratings.
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin">
          <Card className="transition hover:shadow-md hover:border-primary/40">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Admin Panel</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage column permissions across modules.
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Team</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Placeholder module.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
