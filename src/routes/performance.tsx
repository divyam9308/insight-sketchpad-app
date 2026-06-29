import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRole, SAMPLE_USERS } from "@/lib/role-context";
import {
  DEFAULT_ROWS,
  PERF_COLUMNS,
  loadPermissions,
  loadReview,
  rating,
  saveReview,
  type PerfColumnKey,
  type PerfPermissions,
  type PerfRow,
} from "@/lib/performance-types";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance Review — Fyndbridge ATS" },
      {
        name: "description",
        content: "Track allocation, work done, feedback, and weighted ratings.",
      },
    ],
  }),
  component: PerformancePage,
});

function fmt(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function PerformancePage() {
  const { role, me } = useRole();
  const isSuper = role === "super_admin";

  const [selectedUserId, setSelectedUserId] = useState<string>(me.id);
  const [rows, setRows] = useState<PerfRow[]>(() => loadReview(me.id));
  const [saved, setSaved] = useState<PerfRow[]>(rows);
  const [permissions, setPermissions] = useState<PerfPermissions>(() => loadPermissions());

  // Sync when user (or role) changes
  useEffect(() => {
    const targetId = isSuper ? selectedUserId : me.id;
    const loaded = loadReview(targetId);
    setRows(loaded);
    setSaved(loaded);
  }, [selectedUserId, isSuper, me.id]);

  useEffect(() => {
    if (!isSuper) setSelectedUserId(me.id);
  }, [isSuper, me.id]);

  // Listen for permission changes from admin tab
  useEffect(() => {
    const handler = () => setPermissions(loadPermissions());
    window.addEventListener("storage", handler);
    window.addEventListener("fyndbridge:perm-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("fyndbridge:perm-updated", handler);
    };
  }, []);

  const allocationTotal = rows.reduce((s, r) => s + (Number(r.allocation) || 0), 0);
  const selfRatingTotal = rows.reduce((s, r) => s + rating(r.selfScore, r.allocation), 0);
  const ssnsRatingTotal = rows.reduce((s, r) => s + rating(r.ssnsScore, r.allocation), 0);
  const finalRatingTotal = rows.reduce((s, r) => s + rating(r.raScore, r.allocation), 0);

  const allocationValid = Math.round(allocationTotal * 100) === 10000;
  const scoresValid = rows.every((r) =>
    [r.selfScore, r.ssnsScore, r.raScore].every((v) => v >= 0 && v <= 5 && !Number.isNaN(v)),
  );
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved);
  const canSave = allocationValid && scoresValid && dirty;

  const update = (id: string, patch: Partial<PerfRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleSave = () => {
    const targetId = isSuper ? selectedUserId : me.id;
    saveReview(targetId, rows);
    setSaved(rows);
    toast.success("Performance review saved locally.");
  };

  const handleReset = () => {
    setRows(saved);
    toast("Changes reset.");
  };

  // Permission helpers
  const isHidden = (k: PerfColumnKey) =>
    permissions[k] === "super_admin_hidden" && !isSuper;
  const isDisabled = (k: PerfColumnKey) =>
    permissions[k] === "super_admin_disabled" && !isSuper;

  const visibleCols = useMemo(
    () => PERF_COLUMNS.filter((c) => !isHidden(c.key)),
    [permissions, isSuper],
  );

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Performance Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track allocation, work done, feedback, and weighted ratings.
        </p>
      </div>

      {isSuper && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Employee
              <Badge variant="secondary" className="bg-gold/20 text-gold-foreground">
                Super Admin
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">You (Super Admin)</SelectItem>
                {SAMPLE_USERS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              Each employee's review is stored separately in local storage.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Final Rating Total" value={fmt(finalRatingTotal)} tone="gold" />
        <SummaryCard label="Self Rating Total" value={fmt(selfRatingTotal)} />
        <SummaryCard label="SS/NS Rating Total" value={fmt(ssnsRatingTotal)} />
        <SummaryCard label="RA Rating Total" value={fmt(finalRatingTotal)} tone="gold" />
      </div>

      <FinalRatingBanner score={finalRatingTotal} />

      {!allocationValid && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Allocation total must equal 100%.
        </div>
      )}
      {!scoresValid && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Scores must be numbers from 0 to 5.
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Review Categories</CardTitle>
          {dirty && (
            <Badge variant="outline" className="border-gold text-gold-foreground bg-gold/15">
              Unsaved changes
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {visibleCols.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "px-3 py-3 font-semibold whitespace-nowrap",
                        c.key === "category" && "min-w-[260px]",
                        (c.key === "workDone" ||
                          c.key === "ssnsFeedback" ||
                          c.key === "raFeedback") &&
                          "min-w-[220px]",
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border align-top">
                    {visibleCols.map((c) => (
                      <td key={c.key} className="px-3 py-3 align-top">
                        <RowCell
                          row={row}
                          colKey={c.key}
                          disabled={isDisabled(c.key)}
                          onChange={(patch) => update(row.id, patch)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-primary/30 bg-primary/5 font-medium">
                  {visibleCols.map((c) => (
                    <td key={c.key} className="px-3 py-3 whitespace-nowrap">
                      {c.key === "category"
                        ? "Total"
                        : c.key === "allocation"
                          ? `${fmt(allocationTotal)}%`
                          : c.key === "selfRating"
                            ? fmt(selfRatingTotal)
                            : c.key === "ssnsRating"
                              ? fmt(ssnsRatingTotal)
                              : c.key === "finalRating"
                                ? fmt(finalRatingTotal)
                                : ""}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" onClick={handleReset} disabled={!dirty}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "gold";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold",
            tone === "warn" && "text-destructive",
            tone === "gold" && "text-gold-foreground",
            !tone && "text-foreground",
            tone === "ok" && "text-foreground",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function getRatingBand(score: number) {
  if (score < 2)
    return {
      label: "Does not meet expectations",
      range: "Up to 2.0",
      bg: "bg-[#fdecec]",
      border: "border-[#e8a8a8]",
      text: "text-[#8a2f2f]",
      dot: "bg-[#b04545]",
    };
  if (score < 3)
    return {
      label: "Partially meets expectations; below average, significant improvement required",
      range: "2.0 - 3.0",
      bg: "bg-[#fdeee4]",
      border: "border-[#ecc4a8]",
      text: "text-[#8a5230]",
      dot: "bg-[#c97a4a]",
    };
  if (score < 3.5)
    return {
      label: "Meets defined expectations; improvement required",
      range: "3.0 - 3.5",
      bg: "bg-[#fdf6e3]",
      border: "border-[#e8d39a]",
      text: "text-[#7a5d1f]",
      dot: "bg-[#c9a346]",
    };
  if (score < 4)
    return {
      label: "Good performance; scope of improvement in few areas",
      range: "3.5 - 4.0",
      bg: "bg-[#f1f6e4]",
      border: "border-[#cfdca0]",
      text: "text-[#556b1f]",
      dot: "bg-[#8aa84a]",
    };
  if (score < 4.5)
    return {
      label: "Strong performance",
      range: "4.0 - 4.5",
      bg: "bg-[#ecf6ec]",
      border: "border-[#b7d8b7]",
      text: "text-[#2f6b3a]",
      dot: "bg-[#5aa069]",
    };
  return {
    label: "Exceptional performance",
    range: "4.5 and above",
    bg: "bg-[#e2f1e4]",
    border: "border-[#8fbf97]",
    text: "text-[#1f5a30]",
    dot: "bg-[#3d7f4f]",
  };
}

function FinalRatingBanner({ score }: { score: number }) {
  const band = getRatingBand(score);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border px-5 py-4 shadow-sm",
        band.bg,
        band.border,
      )}
    >
      <span className={cn("h-2.5 w-2.5 rounded-full", band.dot)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", band.text)}>{band.label}</p>
        <p className={cn("text-xs opacity-80", band.text)}>{band.sub}</p>
      </div>
      <div className={cn("text-2xl font-bold tabular-nums", band.text)}>
        {(Math.round(score * 100) / 100).toFixed(2)}
        <span className="text-sm font-medium opacity-70"> / 5</span>
      </div>
    </div>
  );
}


function RowCell({
  row,
  colKey,
  disabled,
  onChange,
}: {
  row: PerfRow;
  colKey: PerfColumnKey;
  disabled: boolean;
  onChange: (patch: Partial<PerfRow>) => void;
}) {
  const readOnlyClass =
    "rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground border border-border/60";

  switch (colKey) {
    case "category":
      return (
        <Textarea
          value={row.category}
          disabled={disabled}
          onChange={(e) => onChange({ category: e.target.value })}
          className="min-h-[60px] resize-y"
        />
      );
    case "allocation":
      return (
        <div className="relative">
          <Input
            type="number"
            min={0}
            max={100}
            value={row.allocation}
            disabled={disabled}
            onChange={(e) => onChange({ allocation: Number(e.target.value) })}
            className="w-24 pr-7"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
        </div>
      );
    case "workDone":
      return (
        <Textarea
          value={row.workDone}
          disabled={disabled}
          onChange={(e) => onChange({ workDone: e.target.value })}
          placeholder="Describe key work done…"
          className="min-h-[80px] resize-y"
        />
      );
    case "selfScore":
      return (
        <Input
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={row.selfScore}
          disabled={disabled}
          onChange={(e) => onChange({ selfScore: Number(e.target.value) })}
          className="w-20"
        />
      );
    case "selfRating":
      return <div className={readOnlyClass}>{fmt(rating(row.selfScore, row.allocation))}</div>;
    case "ssnsFeedback":
      return (
        <Textarea
          value={row.ssnsFeedback}
          disabled={disabled}
          onChange={(e) => onChange({ ssnsFeedback: e.target.value })}
          placeholder="SS/NS feedback…"
          className="min-h-[80px] resize-y"
        />
      );
    case "ssnsScore":
      return (
        <Input
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={row.ssnsScore}
          disabled={disabled}
          onChange={(e) => onChange({ ssnsScore: Number(e.target.value) })}
          className="w-20"
        />
      );
    case "ssnsRating":
      return <div className={readOnlyClass}>{fmt(rating(row.ssnsScore, row.allocation))}</div>;
    case "raFeedback":
      return (
        <Textarea
          value={row.raFeedback}
          disabled={disabled}
          onChange={(e) => onChange({ raFeedback: e.target.value })}
          placeholder="Reviewing authority feedback…"
          className="min-h-[80px] resize-y"
        />
      );
    case "raScore":
      return (
        <Input
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={row.raScore}
          disabled={disabled}
          onChange={(e) => onChange({ raScore: Number(e.target.value) })}
          className="w-20"
        />
      );
    case "finalRating":
      return <div className={readOnlyClass}>{fmt(rating(row.raScore, row.allocation))}</div>;
    default:
      return null;
  }
}

// Keep DEFAULT_ROWS referenced to avoid tree-shake confusion in some setups
void DEFAULT_ROWS;
