"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantData } from "../_data/TenantDataProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PaymentCheckout } from "@/features/billing/components/payment-checkout";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Zap,
  PenTool,
  Shield,
  User,
  ChevronRight,
  PartyPopper,
  Loader2,
  Building2,
  Euro,
  Calendar,
  CreditCard,
  MessageCircle,
  History,
  Info,
  MapPin,
  Phone,
  ArrowUpRight,
  Wrench
} from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/helpers/format";
import { Badge } from "@/components/ui/badge";
import { DocumentDownloadButton } from "@/components/documents/DocumentDownloadButton";
import { PageTransition } from "@/components/ui/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

// Constantes pour le layout
const LEASE_TYPE_LABELS: Record<string, string> = {
  nu: "Location nue",
  meuble: "Location meublée",
  colocation: "Colocation",
  saisonnier: "Location saisonnière",
  mobilite: "Bail mobilité",
};

export function DashboardClient() {
  const { dashboard } = useTenantData();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Gestion du logement sélectionné si multi-baux
  const [selectedLeaseIndex, setSelectedLeaseIndex] = useState(0);

  const currentLease = useMemo(() => {
    if (!dashboard?.leases || dashboard.leases.length === 0) return dashboard?.lease;
    return dashboard.leases[selectedLeaseIndex];
  }, [dashboard, selectedLeaseIndex]);

  const currentProperty = useMemo(() => currentLease?.property, [currentLease]);

  // 1. Logique de tri du flux d'activité unifié
  const activityFeed = useMemo(() => {
    if (!dashboard) return [];
    
    const items = [
      ...(dashboard.invoices || []).map(inv => ({
        id: `inv-${inv.id}`,
        date: new Date(inv.created_at || new Date()),
        type: 'invoice',
        title: `Loyer ${inv.periode}`,
        amount: inv.montant_total,
        status: inv.statut,
        raw: inv
      })),
      ...(dashboard.tickets || []).map(t => ({
        id: `tick-${t.id}`,
        date: new Date(t.created_at || new Date()),
        type: 'ticket',
        title: t.titre,
        status: t.statut,
        raw: t
      }))
    ];

    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [dashboard]);

  // 2. Calcul des actions requises (Command Center)
  const pendingActions = useMemo(() => {
    if (!dashboard) return [];
    const actions = [];
    
    if (dashboard.stats?.unpaid_amount > 0) {
      actions.push({
        id: 'payment',
        label: `Régulariser ${formatCurrency(dashboard.stats.unpaid_amount)}`,
        icon: CreditCard,
        color: 'text-red-600',
        bg: 'bg-red-50',
        href: '/app/tenant/payments'
      });
    }
    
    if (dashboard.pending_edls?.length > 0) {
      actions.push({
        id: 'edl',
        label: `Signer l'état des lieux`,
        icon: PenTool,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        href: `/signature-edl/${dashboard.pending_edls[0].invitation_token}`
      });
    }
    
    if (!dashboard.insurance?.has_insurance) {
      actions.push({
        id: 'insurance',
        label: "Déposer l'attestation d'assurance",
        icon: Shield,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        href: '/app/tenant/documents'
      });
    }
    
    return actions;
  }, [dashboard]);

  if (!dashboard) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
    
    return (
      <PageTransition>
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-8">
        
        {/* --- SECTION 1 : HEADER & COMMAND CENTER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Bonjour, {dashboard.tenant?.prenom || "Locataire"} 👋
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {pendingActions.length > 0 
                ? `Vous avez ${pendingActions.length} action${pendingActions.length > 1 ? 's' : ''} en attente.`
                : "Tout est en ordre dans votre logement."}
            </p>
          </motion.div>

          <AnimatePresence>
            {pendingActions.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap gap-2">
                {pendingActions.map(action => (
                  <Button 
                    key={action.id}
                    variant="ghost" 
                    asChild
                    className={cn(
                      "h-auto py-2.5 px-5 border shadow-sm transition-all hover:scale-105 rounded-xl border-current/10",
                      action.bg, action.color
                    )}
                  >
                    <Link href={action.href} className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      <span className="text-sm font-bold">{action.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </Link>
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- SECTION 2 : BENTO GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* A. CARTE LOGEMENT (Principale) - 8/12 */}
          <motion.div 
            className="lg:col-span-8 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="relative overflow-hidden h-full border-none shadow-2xl bg-slate-900 text-white min-h-[380px]">
              <div className="absolute inset-0 z-0">
                {currentProperty?.cover_url ? (
                  <OptimizedImage 
                    src={currentProperty.cover_url} 
                    alt="Logement" 
                    fill 
                    className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-blue-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              </div>

              <CardContent className="relative z-10 p-8 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                      <StatusBadge 
                        status={currentLease?.statut === 'active' ? 'Bail Actif' : 'En attente'} 
                        type={currentLease?.statut === 'active' ? 'success' : 'warning'}
                        className="bg-white/10 text-white border-white/20 backdrop-blur-md px-3 h-7 font-bold"
                      />
                      <Badge variant="outline" className="text-white/70 border-white/20 h-7 font-bold">
                        {LEASE_TYPE_LABELS[currentLease?.type_bail || ''] || "Location"}
                      </Badge>
                    </div>
                    
                    {/* Multi-logements Selector */}
                    {dashboard.leases?.length > 1 && (
                      <div className="flex gap-1.5 p-1 bg-white/10 backdrop-blur-xl rounded-lg border border-white/10">
                        {dashboard.leases.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedLeaseIndex(idx)}
                            className={cn(
                              "w-3 h-3 rounded-full transition-all",
                              selectedLeaseIndex === idx ? "bg-white scale-125 shadow-[0_0_10px_white]" : "bg-white/30 hover:bg-white/50"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-black mb-3 leading-tight max-w-2xl tracking-tight">
                    {currentProperty?.adresse_complete}
                  </h2>
                  <p className="text-xl text-white/70 font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-indigo-400" />
                    {currentProperty?.ville}, {currentProperty?.code_postal}
                      </p>
                    </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-white/10">
                  <DocumentDownloadButton 
                    type="lease" 
                    leaseId={currentLease?.id} 
                    variant="secondary" 
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xl h-12 px-6 rounded-xl font-bold transition-all"
                    label="Mon Bail PDF"
                  />
                  <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xl h-12 px-6 rounded-xl font-bold transition-all" asChild>
                    <Link href="/app/tenant/lease" className="gap-2">
                      <Building2 className="h-4 w-4" /> Fiche Technique
                    </Link>
                  </Button>
                  <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xl h-12 px-6 rounded-xl font-bold transition-all" asChild>
                    <Link href="/app/tenant/meters" className="gap-2">
                      <Zap className="h-4 w-4 text-amber-400" /> Relevés
                    </Link>
                  </Button>
              </div>
              </CardContent>
            </GlassCard>
          </motion.div>

          {/* B. CARTE FINANCE (Widget) - 4/12 */}
          <motion.div 
            className="lg:col-span-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="h-full border-slate-200 bg-white shadow-xl flex flex-col justify-between p-8">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="p-4 bg-indigo-50 rounded-[1.5rem] shadow-inner">
                    <Euro className="h-7 w-7 text-indigo-600" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-50 border-slate-100 text-[10px] font-black uppercase tracking-widest px-3 h-6">Loyer Mensuel</Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Montant total CC</p>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">
                    {formatCurrency((currentLease?.loyer || 0) + (currentLease?.charges_forfaitaires || 0))}
                  </p>
                </div>

                <div className="mt-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-500">Santé du mois</span>
                    <span className={cn(
                      "text-sm font-black uppercase tracking-widest",
                      dashboard.stats?.unpaid_amount > 0 ? "text-red-600" : "text-emerald-600"
                    )}>
                      {dashboard.stats?.unpaid_amount > 0 ? "Retard" : "À jour"}
                    </span>
                  </div>
                  <Progress 
                    value={dashboard.stats?.unpaid_amount > 0 ? 30 : 100} 
                    className={cn(
                      "h-2.5 rounded-full bg-slate-100",
                      dashboard.stats?.unpaid_amount > 0 ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"
                    )}
                  />
                </div>
                </div>

                <Button 
                  asChild
                className={cn(
                  "w-full h-14 mt-10 text-lg font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                  dashboard.stats?.unpaid_amount > 0 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-100" 
                    : "bg-slate-900 hover:bg-black shadow-slate-200"
                )}
              >
                <Link href="/app/tenant/payments" className="gap-3">
                  {dashboard.stats?.unpaid_amount > 0 ? "Payer maintenant" : "Voir l'historique"}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
            </GlassCard>
          </motion.div>

          {/* C. FLUX D'ACTIVITÉ UNIFIÉ - 8/12 */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                Flux d'activité
              </h2>
              <Button variant="ghost" size="sm" asChild className="text-indigo-600 font-bold hover:bg-indigo-50">
                <Link href="/app/tenant/payments">Tout voir</Link>
              </Button>
            </div>

            <GlassCard className="p-0 overflow-hidden border-slate-200 shadow-xl bg-white">
              {activityFeed.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl transition-transform group-hover:scale-110",
                          item.type === 'invoice' 
                            ? (item.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')
                            : 'bg-indigo-50 text-indigo-600'
                        )}>
                          {item.type === 'invoice' ? <FileText className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                      
                      <div className="flex items-center gap-6">
                        {item.type === 'invoice' && (
                          <span className="font-black text-slate-900">{formatCurrency(item.amount)}</span>
                        )}
                                <StatusBadge 
                          status={item.status === 'paid' ? 'Payé' : (item.status === 'sent' ? 'À régler' : item.status)}
                          type={item.status === 'paid' ? 'success' : (item.status === 'sent' || item.status === 'late' ? 'error' : 'info')}
                          className="text-[10px] font-black h-6 px-3 uppercase tracking-widest"
                        />
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-slate-200" />
                                    </div>
                  <p className="text-slate-500 font-bold">Aucune activité récente pour le moment.</p>
                                    </div>
                                )}
            </GlassCard>
          </motion.div>

          {/* D. GESTIONNAIRE & SUPPORT - 4/12 */}
          <motion.div 
            className="lg:col-span-4 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Notifications Section */}
            {dashboard.notifications?.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-bold text-slate-800">Alertes</h2>
                  <Link href="/app/tenant/notifications" className="text-xs font-bold text-indigo-600 hover:underline">Tout voir</Link>
                </div>
                <GlassCard className="p-0 overflow-hidden border-slate-200 bg-white shadow-lg">
                  <div className="divide-y divide-slate-100">
                    {dashboard.notifications.map((n: any) => (
                      <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group cursor-pointer">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          !n.is_read ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                        )}>
                          <PenTool className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-bold truncate", !n.is_read ? "text-slate-900" : "text-slate-500")}>{n.title}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{n.message}</p>
                        </div>
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 px-2">Support</h2>
              <GlassCard className="p-6 border-slate-200 bg-white shadow-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Mon Bailleur</p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-14 w-14 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                    {currentLease?.owner?.name?.[0] || "P"}
                  </div>
                                    <div>
                    <p className="font-black text-slate-900 text-lg leading-tight">{currentLease?.owner?.name || "Propriétaire"}</p>
                    <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg inline-block mt-1">Gérance Certifiée</p>
                    </div>
                </div>
                
                        <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold rounded-xl shadow-sm" asChild>
                                <Link href="/app/tenant/requests/new">
                      <MessageCircle className="mr-2 h-4 w-4" /> Aide
                                </Link>
                            </Button>
                  <Button variant="outline" className="h-12 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold rounded-xl shadow-sm">
                    <Phone className="mr-2 h-4 w-4" /> Contact
                            </Button>
                </div>
              </GlassCard>

              {/* Tips contextuel SOTA */}
              <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer group">
                <GlassCard className="p-6 border-none bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl relative overflow-hidden">
                  <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/20 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                  <div className="relative z-10">
                    <p className="font-black text-lg mb-2 flex items-center gap-2">
                      <Info className="h-5 w-5" /> Le saviez-vous ?
                    </p>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                      L'attestation d'assurance doit être renouvelée chaque année. C'est obligatoire pour garantir votre protection.
                    </p>
                    <Link href="/app/tenant/documents" className="inline-flex items-center gap-1.5 mt-4 text-xs font-black uppercase tracking-widest hover:underline">
                      Mettre à jour <ArrowUpRight className="h-3 w-3" />
                    </Link>
                        </div>
                </GlassCard>
            </motion.div>
          </div>
          </motion.div>

        </div>

        {/* Dialog de paiement */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl overflow-hidden p-0">
            {selectedInvoice && (
              <PaymentCheckout 
                invoiceId={selectedInvoice.id}
                amount={selectedInvoice.montant_total}
                description={`Loyer ${selectedInvoice.periode}`}
                onSuccess={() => { setIsPaymentOpen(false); window.location.reload(); }}
                onCancel={() => setIsPaymentOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
