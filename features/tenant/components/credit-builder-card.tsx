"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { TrendingUp, TrendingDown, ShieldCheck, Sparkles, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CreditScoreData {
  score: number;
  level: "poor" | "fair" | "good" | "excellent";
  change: number;
  factors?: {
    paymentHistory: number;
    leaseHistory: number;
    documents: number;
    incidents: number;
  };
  hasData: boolean;
}

interface CreditBuilderCardProps {
  /** Données du score - si hasData est false, affiche un état vide */
  data?: CreditScoreData;
  /** Score statique (legacy - utilisé si data n'est pas fourni) */
  score?: number;
  className?: string;
  /** Indique si les données sont en cours de chargement */
  isLoading?: boolean;
}

const LEVEL_CONFIG = {
  poor: { label: "Faible", color: "text-red-600", bg: "bg-red-50" },
  fair: { label: "Moyen", color: "text-amber-600", bg: "bg-amber-50" },
  good: { label: "Bon", color: "text-blue-600", bg: "bg-blue-50" },
  excellent: { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50" },
};

export function CreditBuilderCard({ data, score, className, isLoading }: CreditBuilderCardProps) {
  // Si pas de données ou hasData est false, afficher l'état vide
  if (!data?.hasData) {
    return (
      <GlassCard className={cn("relative overflow-hidden", className)}>
        <div className="relative z-10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
                <TrendingUp className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Credit Builder</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Confiance Locative</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-slate-300 tracking-tighter">---</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Non disponible</p>
            </div>
          </div>

          {/* Barre de progression vide */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>300</span>
              <span className="text-slate-300">Pas de données</span>
              <span>850</span>
            </div>
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-0 bg-slate-200" />
            </div>
          </div>

          {/* Message d'état vide */}
          <motion.div 
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Lock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-600">
                Connectez-vous à un bail actif
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Votre score de confiance locative sera calculé à partir de votre historique de paiements et de votre ancienneté.
              </p>
            </div>
          </motion.div>

          <Button 
            disabled 
            className="w-full h-12 bg-slate-200 text-slate-400 font-bold rounded-xl cursor-not-allowed"
          >
            Exporter mon Passeport Confiance
          </Button>
        </div>
      </GlassCard>
    );
  }

  // Données disponibles - afficher le score réel
  const displayScore = data.score;
  const percentage = ((displayScore - 300) / (850 - 300)) * 100;
  const levelConfig = LEVEL_CONFIG[data.level];
  const isPositiveChange = data.change >= 0;

  return (
    <GlassCard className={cn("relative overflow-hidden", className)}>
      <div className="relative z-10 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-2xl border shadow-inner", levelConfig.bg, "border-" + data.level + "-100")}>
              <TrendingUp className={cn("h-6 w-6", levelConfig.color)} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Credit Builder</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Confiance Locative</p>
            </div>
          </div>
          <div className="text-right">
            <motion.p 
              className="text-4xl font-black text-slate-900 tracking-tighter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={displayScore}
            >
              {displayScore}
            </motion.p>
            <p className={cn("text-[10px] font-black uppercase tracking-widest", levelConfig.color)}>
              {levelConfig.label}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>300</span>
            <div className={cn("flex items-center gap-1", isPositiveChange ? "text-emerald-600" : "text-red-500")}>
              {isPositiveChange ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>{isPositiveChange ? "+" : ""}{data.change} pts ce mois</span>
            </div>
            <span>850</span>
          </div>
          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-500 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Facteurs de score */}
        {data.factors && (
          <div className="grid grid-cols-2 gap-2">
            <FactorBadge label="Paiements" value={data.factors.paymentHistory} />
            <FactorBadge label="Ancienneté" value={data.factors.leaseHistory} />
            <FactorBadge label="Documents" value={data.factors.documents} />
            <FactorBadge label="Incidents" value={data.factors.incidents} />
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            {data.level === "excellent" 
              ? "Félicitations ! Votre excellent historique de paiement vous ouvre des portes pour vos futurs projets locatifs."
              : data.level === "good"
              ? "Votre bon score reflète votre sérieux. Continuez ainsi pour atteindre le niveau Excellent !"
              : "Améliorez votre score en payant vos loyers à temps et en complétant vos documents."}
          </p>
        </div>

        <Button className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xl shadow-slate-200 group">
          Exporter mon Passeport Confiance
          <motion.span
            className="ml-2"
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            →
          </motion.span>
        </Button>
      </div>
      
      {/* Glow effect basé sur le niveau */}
      <div className={cn(
        "absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl",
        data.level === "excellent" ? "bg-emerald-500/10" :
        data.level === "good" ? "bg-blue-500/10" :
        data.level === "fair" ? "bg-amber-500/10" :
        "bg-red-500/10"
      )} />
    </GlassCard>
  );
}

function FactorBadge({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return "text-emerald-600 bg-emerald-50";
    if (v >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className={cn("px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center", getColor(value))}>
      <span>{label}</span>
      <span>{value}%</span>
    </div>
  );
}
