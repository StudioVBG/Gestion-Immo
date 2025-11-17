"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useProfile } from "@/lib/hooks/use-profile";
import { OwnerTodoSection } from "@/components/owner/dashboard/owner-todo-section";
import { OwnerFinanceSummary } from "@/components/owner/dashboard/owner-finance-summary";
import { OwnerPortfolioByModule } from "@/components/owner/dashboard/owner-portfolio-by-module";
import { OwnerRiskSection } from "@/components/owner/dashboard/owner-risk-section";
import { OWNER_ROUTES } from "@/lib/config/owner-routes";

interface DashboardData {
  zone1_tasks: Array<{
    id: string;
    type: "rent_arrears" | "sign_contracts" | "indexation" | "lease_end" | "compliance";
    priority: "high" | "medium" | "low";
    label: string;
    count?: number;
    total_amount?: number;
    action_url: string;
  }>;
  zone2_finances: {
    chart_data: Array<{
      period: string;
      expected: number;
      collected: number;
    }>;
    kpis: {
      revenue_current_month: {
        collected: number;
        expected: number;
        percentage: number;
      };
      revenue_last_month: {
        collected: number;
        expected: number;
        percentage: number;
      };
      arrears_amount: number;
    };
  };
  zone3_portfolio: {
    modules: Array<{
      module: "habitation" | "lcd" | "pro" | "parking";
      label: string;
      stats: {
        active_leases?: number;
        monthly_revenue?: number;
        occupancy_rate?: number;
        nights_sold?: number;
        revenue?: number;
        properties_count?: number;
      };
      action_url: string;
    }>;
    compliance: Array<{
      id: string;
      type: "dpe_expiring" | "lease_end" | "indexation_due" | "tax_declaration" | "compliance";
      severity: "high" | "medium" | "low";
      label: string;
      action_url: string;
    }>;
    performance?: any;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function OwnerDashboardV2Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.role && profile.role !== "owner") {
      if (profile.role === "tenant") {
        router.replace("/app/tenant");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [profile, router]);

  useEffect(() => {
    if (profile?.role === "owner") {
      fetchDashboardData();
    }
  }, [profile]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const response = await apiClient.get<DashboardData>("/owner/dashboard");
      
      // S'assurer que la réponse a le bon format
      if (response && response.zone1_tasks && response.zone2_finances && response.zone3_portfolio) {
        setData(response);
      } else {
        // Format de fallback si la structure est différente
        setData({
          zone1_tasks: [],
          zone2_finances: {
            chart_data: [],
            kpis: {
              revenue_current_month: { collected: 0, expected: 0, percentage: 0 },
              revenue_last_month: { collected: 0, expected: 0, percentage: 0 },
              arrears_amount: 0,
            },
          },
          zone3_portfolio: {
            modules: [],
            compliance: [],
          },
        });
      }
    } catch (error: any) {
      console.error("Erreur chargement dashboard:", error);
      // En cas d'erreur, afficher un état vide plutôt que de planter
      setData({
        zone1_tasks: [],
        zone2_finances: {
          chart_data: [],
          kpis: {
            revenue_current_month: { collected: 0, expected: 0, percentage: 0 },
            revenue_last_month: { collected: 0, expected: 0, percentage: 0 },
            arrears_amount: 0,
          },
        },
        zone3_portfolio: {
          modules: [],
          compliance: [],
        },
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6"
        >
          <motion.div
            className="relative mx-auto w-20 h-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-primary opacity-20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg font-medium"
          >
            Chargement de votre tableau de bord...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return <EmptyState />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header avec animation fluide */}
      <motion.header
        variants={itemVariants}
        className="relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="relative flex items-center justify-between p-6 backdrop-blur-sm bg-white/50 rounded-2xl border border-white/20 shadow-xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 100%",
              }}
            >
              Tableau de bord
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mt-2 text-lg"
            >
              Vue d'ensemble de votre portefeuille locatif
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <Button
              asChild
              className="relative overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <Link href={`${OWNER_ROUTES.properties.path}/new`}>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.1 }}
                />
                <span className="relative flex items-center">
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                  </motion.div>
                  Ajouter un bien
                </span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Zone 1 - À faire maintenant */}
      <motion.section variants={itemVariants}>
        <OwnerTodoSection todos={data.zone1_tasks} />
      </motion.section>

      {/* Zone 2 - Vue finances */}
      <motion.section variants={itemVariants}>
        <OwnerFinanceSummary
          chartData={data.zone2_finances.chart_data}
          kpis={data.zone2_finances.kpis}
        />
      </motion.section>

      {/* Zone 3 - Portefeuille & conformité */}
      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-2"
      >
        <OwnerPortfolioByModule modules={data.zone3_portfolio.modules} />
        <OwnerRiskSection risks={data.zone3_portfolio.compliance} />
      </motion.div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <motion.div
        className="max-w-md mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Plus className="h-10 w-10 text-blue-600" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
        >
          Bienvenue !
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-6 text-lg"
        >
          Pour commencer, ajoutez votre premier bien. Nous vous guiderons ensuite
          pour créer un bail et encaisser vos loyers.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            asChild
            size="lg"
            className="relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href={`${OWNER_ROUTES.properties.path}/new`}>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.1 }}
              />
              <span className="relative flex items-center">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                </motion.div>
                Ajouter un bien
              </span>
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
