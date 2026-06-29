import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/lib/role-context";
import {
  CALCULATED_KEYS,
  DEFAULT_PERF_PERMISSIONS,
  PERF_COLUMNS,
  loadPermissions,
  savePermissions,
  type PerfColumnKey,
  type PerfPermission,
  type PerfPermissions,
} from "@/lib/performance-types";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Panel — Fyndbridge ATS" }],
  }),
  component: AdminPanel,
});

const PERF_OPTIONS: { value: PerfPermission; label: string; hint: string }[] = [
  { value: "everyone", label: "Everyone", hint: "Visible/editable for all" },
  {
    value: "super_admin_disabled",
    label: "Super Admin Disabled",
    hint: "Non-super-admins can see but not edit",
  },
  {
    value: "super_admin_hidden",
    label: "Super Admin Hidden",
    hint: "Non-super-admins cannot see the column",
  },
];

function AdminPanel() {
  const { role } = useRole();

  if (role !== "super_admin") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Super Admin only</h2>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view the Admin Panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Column permissions across modules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Column Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clients">
            <TabsList>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="mandates">Mandates</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="clients" className="mt-4">
              <PlaceholderPerms label="Clients" />
            </TabsContent>
            <TabsContent value="candidates" className="mt-4">
              <PlaceholderPerms label="Candidates" />
            </TabsContent>
            <TabsContent value="mandates" className="mt-4">
              <PlaceholderPerms label="Mandates" />
            </TabsContent>
            <TabsContent value="performance" className="mt-4">
              <PerformancePerms />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function PlaceholderPerms({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
      {label} column permissions (existing module — unchanged).
    </div>
  );
}

function PerformancePerms() {
  const [perms, setPerms] = useState<PerfPermissions>(() => loadPermissions());

  useEffect(() => {
    setPerms(loadPermissions());
  }, []);

  const update = (key: PerfColumnKey, value: PerfPermission) => {
    const next = { ...perms, [key]: value };
    setPerms(next);
    savePermissions(next);
    window.dispatchEvent(new Event("fyndbridge:perm-updated"));
    toast.success("Permission updated.");
  };

  const resetAll = () => {
    setPerms({ ...DEFAULT_PERF_PERMISSIONS });
    savePermissions({ ...DEFAULT_PERF_PERMISSIONS });
    window.dispatchEvent(new Event("fyndbridge:perm-updated"));
    toast("Performance permissions reset.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Controls how each column appears in the Performance Review table for non-super-admins.
          Calculated fields stay read-only regardless.
        </p>
        <Button variant="outline" size="sm" onClick={resetAll}>
          Reset to defaults
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Column</th>
              <th className="px-4 py-3 font-semibold">Permission</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {PERF_COLUMNS.map((col) => {
              const calc = CALCULATED_KEYS.includes(col.key);
              return (
                <tr key={col.key} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{col.label}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={perms[col.key]}
                      onValueChange={(v) => update(col.key, v as PerfPermission)}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERF_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {calc ? (
                      <Badge variant="secondary" className="bg-perf-calculated text-perf-calculated-foreground border-perf-calculated-foreground/20">
                        Calculated · always read-only
                      </Badge>
                    ) : (
                      <PermissionBadge value={perms[col.key]} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionBadge({ value }: { value: PerfPermission }) {
  switch (value) {
    case "everyone":
      return (
        <Badge variant="secondary" className="bg-perf-blue-soft text-perf-blue-soft-foreground border-perf-blue-soft-foreground/20">
          Everyone
        </Badge>
      );
    case "super_admin_disabled":
      return (
        <Badge variant="secondary" className="bg-perf-amber text-perf-amber-foreground border-perf-amber-foreground/20">
          Super Admin Disabled
        </Badge>
      );
    case "super_admin_hidden":
      return (
        <Badge variant="secondary" className="bg-perf-rose text-perf-rose-foreground border-perf-rose-foreground/20">
          Super Admin Hidden
        </Badge>
      );
  }
}
