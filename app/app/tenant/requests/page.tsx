import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketListUnified } from "@/features/tickets/components/ticket-list-unified";
import { getTickets } from "@/features/tickets/server/data-fetching";

export default async function TenantRequestsPage() {
  const tickets = await getTickets("tenant");

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mes demandes</h1>
          <p className="text-slate-500 mt-1">Signalez un problème ou suivez vos interventions</p>
        </div>
        <Button asChild className="shadow-lg shadow-blue-500/20">
          <Link href="/app/tenant/requests/new">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>}>
        <TicketListUnified tickets={tickets as any} variant="tenant" />
      </Suspense>
    </div>
  );
}
