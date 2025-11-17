"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Filter,
  Layers,
  Calendar,
  Zap,
  CalendarRange,
  FileText,
  ArrowUpRight,
  Plus,
  Home,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import { useProperties, useLeases, useInvoices } from "@/lib/hooks";

type Scope = "global" | "habitation" | "pro" | "parking";

type RiskRow = {
  id: string;
  type: string;
  severity: "critical" | "important";
  label: string;
  detail: string;
  dueDate: string;
};

type TimelineRow = {
  id: string;
  date: string;
  time?: string;
  category: string;
  label: string;
  detail: string;
  status: "scheduled" | "done" | "late";
};

const DASHBOARD = {
  context: {
    ownerId: "demo-owner",
    scope: "global" as Scope,
    period: { from: "2025-01-01", to: "2025-01-31", label: "Mois en cours" },
    currency: "EUR",
  },
  kpis: {
    cash: { expected: 48650, collected: 42600 },
    arrears: { total: 5650, dsoDays: 22 },
    occupancy: {
      globalRate: 0.86,
      bySegment: { lld: 0.94, str: 0.82, pro: 0.88, parking: 0.76 },
    },
  },
  charts: {
    revenueVsExpected: {
      points: [
        { period: "2024-11", expected: 47000, collected: 45500 },
        { period: "2024-12", expected: 48200, collected: 47000 },
        { period: "2025-01", expected: 48650, collected: 42600 },
      ],
    },
    occupancyBySegment: {
      points: [
        { period: "2024-11", lld: 0.93, str: 0.8, pro: 0.86, parking: 0.74 },
        { period: "2024-12", lld: 0.95, str: 0.84, pro: 0.9, parking: 0.78 },
        { period: "2025-01", lld: 0.94, str: 0.82, pro: 0.88, parking: 0.76 },
      ],
    },
  },
  tables: {
    risks: [
      {
        id: "risk-impaye-1",
        type: "arrears",
        severity: "critical" as const,
        label: "Impayé N3",
        detail: "Bail LLD-023 · 1 850 € · 35 jours de retard",
        dueDate: "2025-01-10",
      },
      {
        id: "risk-ilc-1",
        type: "indexation",
        severity: "important" as const,
        label: "Indexation ILC non appliquée",
        detail: "Bail COM-112 · 3 ans de retard",
        dueDate: "2024-10-01",
      },
      {
        id: "risk-lg-1",
        type: "lg_publication",
        severity: "critical" as const,
        label: "Location-gérance non publiée",
        detail: "Restaurant 23 Juillet · délai dépassé",
        dueDate: "2025-01-05",
      },
      {
        id: "risk-diag-1",
        type: "diagnostic",
        severity: "critical" as const,
        label: "DPE expiré",
        detail: "Studio Neuilly · Bail LLD-017",
        dueDate: "2024-12-31",
      },
    ] satisfies RiskRow[],
    timeline: [
      {
        id: "event-1",
        date: "2025-01-17",
        time: "09:00",
        category: "inspection",
        label: "EDL sortie – 12 Rue du Temple",
        detail: "Bail LLD-008",
        status: "scheduled" as const,
      },
      {
        id: "event-2",
        date: "2025-01-18",
        time: "15:30",
        category: "move_in",
        label: "Entrée locataire – Loft Beaubourg",
        detail: "Bail LLD-023",
        status: "scheduled" as const,
      },
      {
        id: "event-3",
        date: "2025-01-20",
        time: "11:00",
        category: "lg_publication",
        label: "Publication location-gérance – Restaurant 23 Juillet",
        detail: "",
        status: "late" as const,
      },
    ] satisfies TimelineRow[],
    segments: {
      str: {
        topUnits: [
          { unitName: "Penthouse Rivoli", revenue: 8200, occupancy: 0.91, note: 4.9, cancelRate: 0.02 },
          { unitName: "Villa Atlantique", revenue: 6400, occupancy: 0.85, note: 4.7, cancelRate: 0.05 },
        ],
        orphanNights: [
          { unitName: "Loft Beaubourg", date: "2025-01-24", gap: 1 },
          { unitName: "Villa Atlantique", date: "2025-01-28", gap: 2 },
        ],
      },
      lld: {
        topArrears: [
          { leaseCode: "LLD-023", unitName: "T2 République", amount: 1850, daysOverdue: 35, lastAction: "N2 envoyée" },
          { leaseCode: "LLD-018", unitName: "T3 Bastille", amount: 920, daysOverdue: 18, lastAction: "N1 envoyée" },
        ],
        irIndexations: { done: 4, pending: 2 },
        colocations: { active: 7, withIssues: 2 },
      },
      pro: {
        summary: {
          revenueHtPeriod: 32800,
          occupancyRate: 0.88,
          occupiedAreaM2: 3200,
          totalAreaM2: 3640,
          redevancesLg: 5400,
        },
        leasesToWatch: [
          { leaseCode: "COM-112", reason: "Renouvellement dans 3 mois · risque déplafonnement" },
          { leaseCode: "COM-089", reason: "Renouvellement dans 9 mois" },
        ],
        indexationsPro: { lateCount: 2 },
        preferenceDroit: { pendingNotifications: 1 },
      },
      parking: {
        summary: { occupancyRate: 0.76, periodRevenue: 1400 },
        sites: [
          { name: "Parc République", totalPlaces: 40, freePlaces: 4 },
          { name: "Parking Victor Hugo", totalPlaces: 20, freePlaces: 2 },
        ],
        irve: { hasIrve: true, needsBilling: true, contractsToReview: 2 },
      },
    },
  },
  health: {
    automations: [
      {
        id: "auto-str-pricing",
        name: "STR pricing (J-3)",
        status: "on",
        lastRunAt: "2025-01-15T08:00:00Z",
        nextRunAt: "2025-01-18T08:00:00Z",
      },
      {
        id: "auto-ll-irl",
        name: "Indexation IRL trimestrielle",
        status: "error",
        lastRunAt: "2025-01-10T05:00:00Z",
      },
    ],
    integrations: [
      { id: "int-sepa", name: "Paiements SEPA", status: "ok", note: "Opérationnel" },
      { id: "int-card", name: "Paiements carte", status: "pending", note: "Activation banque en cours" },
      { id: "int-smartlocks", name: "Smartlocks", status: "error", note: "Problème API Admin requis" },
    ],
  },
};

const FILTER_SCOPES: { label: string; value: Scope }[] = [
  { label: "Tous les biens", value: "global" },
  { label: "Portefeuille Habitation", value: "habitation" },
  { label: "Portefeuille Pro", value: "pro" },
  { label: "Parkings", value: "parking" },
];

const PERIODS = [
  { label: "Mois en cours", value: "month" },
  { label: "30 jours", value: "30d" },
  { label: "90 jours", value: "90d" },
  { label: "Personnalisé", value: "custom" },
];

export default function OwnerDashboardPage() {
  const [scope, setScope] = useState<Scope>("global");
  const [period, setPeriod] = useState("month");
  const [viewMode, setViewMode] = useState("global");
  const [selectedRisk, setSelectedRisk] = useState<RiskRow | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineRow | null>(null);

  // Utilisation des hooks React Query pour les données réelles
  const { data: properties = [], isLoading: loadingProperties } = useProperties();
  const { data: leases = [], isLoading: loadingLeases } = useLeases();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();

  // Calculer les KPIs depuis les données réelles
  const realKpis = useMemo(() => {
    const totalCollected = invoices
      .filter((inv) => inv.statut === "paid")
      .reduce((sum, inv) => sum + Number(inv.montant_total), 0);
    
    const totalExpected = invoices
      .reduce((sum, inv) => sum + Number(inv.montant_total), 0);
    
    const activeLeases = leases.filter((l) => l.statut === "active").length;
    const totalProperties = properties.length;
    const occupancyRate = totalProperties > 0 ? activeLeases / totalProperties : 0;
    
    return {
      collected: totalCollected,
      expected: totalExpected,
      occupancyRate,
      activeLeases,
      totalProperties,
    };
  }, [invoices, leases, properties]);

  // Données pour les charts depuis les factures réelles
  const realChartData = useMemo(() => {
    return invoices
      .filter((inv) => inv.statut === "paid")
      .map((inv) => ({
        period: inv.periode,
        expected: Number(inv.montant_total),
        collected: Number(inv.montant_total),
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-3); // Derniers 3 mois
  }, [invoices]);

  // Utiliser les données réelles si disponibles, sinon fallback sur mock
  const data = useMemo(() => {
    const baseData = { ...DASHBOARD };
    
    // Enrichir avec les données réelles si disponibles
    if (realKpis.totalProperties > 0) {
      baseData.kpis.cash = {
        expected: realKpis.expected,
        collected: realKpis.collected,
      };
      baseData.kpis.occupancy.globalRate = realKpis.occupancyRate;
    }
    
    if (realChartData.length > 0) {
      baseData.charts.revenueVsExpected.points = realChartData.map((d) => ({
        period: d.period,
        expected: d.expected,
        collected: d.collected,
      }));
    }
    
    return baseData;
  }, [realKpis, realChartData]);

  const isLoading = loadingProperties || loadingLeases || loadingInvoices;

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10">
          <header className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500">Tableau de bord propriétaire</p>
                <h1 className="text-3xl font-semibold text-slate-900">Contrôlez votre portefeuille en 3 secondes</h1>
                <p className="text-sm text-slate-500">Cash, occupation, risques et actions prioritaires sur un seul écran.</p>
              </div>
              <div className="flex gap-3">
                <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/properties/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un bien (V3)
                  </Link>
                </Button>
                <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
                  <Zap className="mr-2 h-4 w-4" />
                  Demander de l'aide
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={scope} onValueChange={(value: Scope) => setScope(value)}>
                <SelectTrigger className="border-slate-200">
                  <Filter className="mr-2 h-4 w-4 text-slate-500" />
                  <SelectValue placeholder="Périmètre" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_SCOPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="border-slate-200">
                  <Layers className="mr-2 h-4 w-4 text-slate-500" />
                  <SelectValue placeholder="Vue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Vue globale</SelectItem>
                  <SelectItem value="property">Vue par bien</SelectItem>
                  <SelectItem value="lease">Vue par bail</SelectItem>
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="border-slate-200">
                  <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </header>

          <section className="space-y-4">
            <KpiRow kpis={data.kpis} />
            <div className="grid gap-4 md:grid-cols-2">
              <RevenueChartCard chart={data.charts.revenueVsExpected.points} />
              <OccupancyChartCard chart={data.charts.occupancyBySegment.points} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <RiskTable rows={data.tables.risks} onSelect={setSelectedRisk} />
            <TimelineTable rows={data.tables.timeline} onSelect={setSelectedEvent} />
          </section>

          <SegmentsGrid segments={data.tables.segments} />

          <HealthPanel health={data.health} />

          <ExportSection />
        </div>
      </div>

      <DetailSheet item={selectedRisk} onClose={() => setSelectedRisk(null)} title="Détail du bail / action" />
      <DetailSheet item={selectedEvent} onClose={() => setSelectedEvent(null)} title="Événement" />
    </ProtectedRoute>
  );
}

function KpiRow({ kpis }: { kpis: typeof DASHBOARD.kpis }) {
  const encaissementRate = kpis.cash.expected > 0 ? Math.round((kpis.cash.collected / kpis.cash.expected) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-xs uppercase text-slate-500">Encaissements mois</p>
          <p className="text-2xl font-semibold text-slate-900">
            {kpis.cash.collected.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
          <p className="text-xs text-slate-500">
            Attendu {kpis.cash.expected.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} · {encaissementRate}% encaissé
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-xs uppercase text-slate-500">Impayés & DSO</p>
          <p className="text-2xl font-semibold text-slate-900">
            {kpis.arrears.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
          <p className="text-xs text-slate-500">DSO {kpis.arrears.dsoDays} jours</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-xs uppercase text-slate-500">Occupation globale</p>
          <p className="text-2xl font-semibold text-slate-900">{Math.round(kpis.occupancy.globalRate * 100)}%</p>
          <p className="text-xs text-slate-500">
            LLD {(kpis.occupancy.bySegment.lld * 100).toFixed(0)}% · STR {(kpis.occupancy.bySegment.str * 100).toFixed(0)}% · Pro {(kpis.occupancy.bySegment.pro * 100).toFixed(0)}% ·
            Parkings {(kpis.occupancy.bySegment.parking * 100).toFixed(0)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ... truncated for brevity

function RevenueChartCard({ chart }: { chart: typeof DASHBOARD.charts.revenueVsExpected.points }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenus vs attendus</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip formatter={(value: number) => value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} />
            <Legend />
            <Line type="monotone" dataKey="expected" name="Attendu" stroke="#94a3b8" strokeWidth={2} />
            <Line type="monotone" dataKey="collected" name="Encaissé" stroke="#0f172a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function OccupancyChartCard({ chart }: { chart: typeof DASHBOARD.charts.occupancyBySegment.points }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupation par segment</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(value) => `${Math.round(value * 100)}%`} />
            <Tooltip formatter={(value: number) => `${Math.round(value * 100)}%`} />
            <Legend />
            <Bar dataKey="lld" name="LLD" fill="#0f172a" />
            <Bar dataKey="str" name="STR" fill="#334155" />
            <Bar dataKey="pro" name="Pro" fill="#64748b" />
            <Bar dataKey="parking" name="Parkings" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RiskTable({ rows, onSelect }: { rows: RiskRow[]; onSelect: (row: RiskRow) => void }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Baux & loyers à risque</CardTitle>
          <CardDescription>Cliquer pour ouvrir le panneau d’action</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-600"
          onClick={() => {
            // TODO: Implémenter la page des impayés
            console.log("Page des impayés à implémenter");
          }}
        >
          Tout voir
          <ArrowUpRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Risque</th>
              <th className="px-4 py-2 text-left">Échéance</th>
              <th className="px-4 py-2 text-right">Gravité</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="cursor-pointer border-b last:border-0 hover:bg-slate-50" onClick={() => onSelect(row)}>
                <td className="px-4 py-3 text-xs uppercase text-slate-500">{row.type}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{row.label}</p>
                  <p className="text-xs text-slate-500">{row.detail}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{row.dueDate}</td>
                <td className="px-4 py-3 text-right">
                  <Badge variant={row.severity === "critical" ? "destructive" : "secondary"}>
                    {row.severity === "critical" ? "Critique" : "Important"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function TimelineTable({ rows, onSelect }: { rows: TimelineRow[]; onSelect: (row: TimelineRow) => void }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Planning 30 jours</CardTitle>
          <CardDescription>Entrées, sorties, publications, interventions…</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1 text-slate-600">
          <CalendarRange className="h-4 w-4" />
          {rows.length} événements
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Détail</th>
              <th className="px-4 py-2 text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="cursor-pointer border-b last:border-0 hover:bg-slate-50" onClick={() => onSelect(row)}>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {row.date}
                  {row.time && ` · ${row.time}`}
                </td>
                <td className="px-4 py-3 text-xs uppercase text-slate-500">{row.category}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{row.label}</p>
                  <p className="text-xs text-slate-500">{row.detail}</p>
                </td>
                <td className="px-4 py-3 text-right text-xs text-slate-500">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SegmentsGrid({ segments }: { segments: typeof DASHBOARD.tables.segments }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>STR – Performance & pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="text-left">Bien</th>
                <th className="text-right">CA</th>
                <th className="text-right">Occ.</th>
                <th className="text-right">Note</th>
              </tr>
            </thead>
            <tbody>
              {segments.str.topUnits.map((unit) => (
                <tr key={unit.unitName} className="border-b last:border-0">
                  <td className="py-2">{unit.unitName}</td>
                  <td className="py-2 text-right">
                    {unit.revenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </td>
                  <td className="py-2 text-right">{Math.round(unit.occupancy * 100)}%</td>
                  <td className="py-2 text-right">{unit.note.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            Nuits orphelines à combler : {segments.str.orphanNights.map((night) => `${night.unitName} (${night.date})`).join(" · ")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LLD / Habitation – Loyers & colocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <div>
            <p className="mb-2 text-xs uppercase text-slate-500">Top impayés</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="text-left">Bail</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Retard</th>
                </tr>
              </thead>
              <tbody>
                {segments.lld.topArrears.map((arrear) => (
                  <tr key={arrear.leaseCode} className="border-b last:border-0">
                    <td className="py-2">{arrear.leaseCode}</td>
                    <td className="py-2 text-right">
                      {arrear.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </td>
                    <td className="py-2 text-right">{arrear.daysOverdue} j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            Indexations IRL : {segments.lld.irIndexations.done} faites · {segments.lld.irIndexations.pending} à faire · Colocations : {segments.lld.colocations.active} actives ({segments.lld.colocations.withIssues} à suivre)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commerces / Bureaux / Location-gérance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Revenus HT période</p>
              <p className="text-lg font-semibold">
                {segments.pro.summary.revenueHtPeriod.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Occupation</p>
              <p className="text-lg font-semibold">
                {Math.round(segments.pro.summary.occupancyRate * 100)}% · {segments.pro.summary.occupiedAreaM2} m² / {segments.pro.summary.totalAreaM2} m²
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase text-slate-500">Baux à surveiller</p>
            <ul className="space-y-1 text-sm text-slate-700">
              {segments.pro.leasesToWatch.map((lease) => (
                <li key={lease.leaseCode} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="font-medium text-slate-900">{lease.leaseCode}</span> – {lease.reason}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            Indexations ILC/ILAT retard : {segments.pro.indexationsPro.lateCount} · Droit de préférence : {segments.pro.preferenceDroit.pendingNotifications} notification(s)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parkings & IRVE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Taux d’occupation</p>
            <p className="text-lg font-semibold">{Math.round(segments.parking.summary.occupancyRate * 100)}%</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Revenus période</p>
            <p className="text-lg font-semibold">
              {segments.parking.summary.periodRevenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase text-slate-500">Places libres</p>
            <ul className="list-disc pl-4 text-xs text-slate-600">
              {segments.parking.sites.map((site) => (
                <li key={site.name}>
                  {site.name} – {site.freePlaces} libres / {site.totalPlaces}
                </li>
              ))}
            </ul>
          </div>
          {segments.parking.irve.hasIrve && (
            <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
              IRVE : {segments.parking.irve.needsBilling ? "Consos à refacturer" : "RAS"} · Contrats à vérifier : {segments.parking.irve.contractsToReview}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function HealthPanel({ health }: { health: typeof DASHBOARD.health }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Santé automations internes</CardTitle>
          <CardDescription>Ce qui tourne pour vous</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {health.automations.map((auto) => (
            <div key={auto.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{auto.name}</p>
                  <p className="text-xs text-slate-500">Dernier run {auto.lastRunAt ? new Date(auto.lastRunAt).toLocaleString("fr-FR") : "?"}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    auto.status === "on" && "bg-emerald-100 text-emerald-900",
                    auto.status === "error" && "bg-red-100 text-red-900",
                    auto.status === "off" && "bg-slate-100 text-slate-600"
                  )}
                >
                  {auto.status === "on" ? "ON" : auto.status === "error" ? "Erreur" : "OFF"}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" size="sm" className="text-slate-700">
                  Voir les détails
                </Button>
                <Button variant="outline" size="sm" className="text-slate-700">
                  {auto.status === "on" ? "Désactiver" : "Relancer"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intégrations gérées par l’Admin</CardTitle>
          <CardDescription>Statut lecture seule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {health.integrations.map((integration) => (
            <div key={integration.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{integration.name}</p>
                  <p className="text-xs text-slate-500">{integration.note}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    integration.status === "ok" && "bg-emerald-100 text-emerald-900",
                    integration.status === "pending" && "bg-amber-100 text-amber-800",
                    integration.status === "error" && "bg-red-100 text-red-900"
                  )}
                >
                  {integration.status === "ok" ? "OK" : integration.status === "pending" ? "En attente" : "Erreur"}
                </span>
              </div>
              <div className="mt-2">
                <Button variant="ghost" size="sm" className="text-slate-700">
                  Demander à l’Admin
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function ExportSection() {
  const exports = ["FEC / Journaux", "Taxe de séjour", "Indexations IRL / ILC", "Diagnostics & assurances", "Baux commerciaux", "Parkings"];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">Rapports & exports</p>
          <h2 className="text-xl font-semibold text-slate-900">Tout exporter en un clic</h2>
        </div>
        <Button className="bg-slate-900 text-white hover:bg-slate-800">Exporter tout (zip)</Button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {exports.map((label) => (
          <Button
            key={label}
            variant="ghost"
            className="justify-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}

function DetailSheet({ item, onClose, title }: { item: { label: string; detail: string } | null; onClose: () => void; title: string }) {
  return (
    <Sheet open={!!item} onOpenChange={onClose}>
      <SheetContent className="w-[420px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Préparez l’action associée.</SheetDescription>
        </SheetHeader>
        {item && (
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{item.label}</p>
            <p className="text-slate-600">{item.detail || "Consulter le dossier pour plus d’informations."}</p>
            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">Ouvrir le dossier</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
