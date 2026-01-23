"use client";

/**
 * Modèle État des Lieux de Sortie
 *
 * SEO: Cible "état des lieux sortie gratuit", "EDL sortie modèle"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Sparkles,
  Shield,
  Scale,
} from "lucide-react";

const SPECIFICITES_SORTIE = [
  {
    title: "Comparatif entrée/sortie",
    description: "Chaque élément est comparé avec l'EDL d'entrée pour identifier les évolutions",
  },
  {
    title: "Grille de vétusté",
    description: "Application de la vétusté pour ne facturer que l'usure anormale",
  },
  {
    title: "Chiffrage des dégradations",
    description: "Espace pour estimer le coût des réparations éventuelles",
  },
  {
    title: "Relevés de compteurs",
    description: "Index finaux pour permettre la résiliation des contrats énergie",
  },
];

const COMPARATIF_EXEMPLE = [
  { element: "Parquet séjour", entree: "Bon état, quelques rayures légères", sortie: "Rayures profondes, taches", evolution: "Dégradation" },
  { element: "Peinture chambre", entree: "Bon état", sortie: "Traces, trous de chevilles", evolution: "Usure normale" },
  { element: "Robinet cuisine", entree: "Bon état", sortie: "Fuite au niveau du joint", evolution: "À vérifier" },
];

export default function ModeleEtatDesLieuxSortiePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/modeles"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les modèles
            </Link>

            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">
                  <ClipboardCheck className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Modèle{" "}
                <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                  État des Lieux de Sortie
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Avec comparatif entrée/sortie et calcul de vétusté. Identifiez
                clairement les dégradations imputables au locataire.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-white">Conforme décret 2016</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Scale className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-white">Grille vétusté incluse</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-white">2 800 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-rose-600 hover:bg-rose-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF
                </Button>
                <Link href="/modeles/etat-des-lieux-entree">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    EDL d'entrée
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Spécificités */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Spécificités de l'EDL de sortie
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SPECIFICITES_SORTIE.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Exemple comparatif */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Exemple de comparatif
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400">Élément</th>
                          <th className="text-left py-3 px-4 text-slate-400">État entrée</th>
                          <th className="text-left py-3 px-4 text-slate-400">État sortie</th>
                          <th className="text-left py-3 px-4 text-slate-400">Évolution</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        {COMPARATIF_EXEMPLE.map((row, i) => (
                          <tr key={i} className="border-b border-slate-700/50">
                            <td className="py-3 px-4 font-medium text-white">{row.element}</td>
                            <td className="py-3 px-4">{row.entree}</td>
                            <td className="py-3 px-4">{row.sortie}</td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  row.evolution === "Dégradation"
                                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                                    : row.evolution === "Usure normale"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                }
                              >
                                {row.evolution}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Délai contestation */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Délai de contestation
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Le locataire dispose de <strong className="text-white">10 jours</strong> après
                    la signature de l'EDL de sortie pour le contester par lettre recommandée.
                    Passé ce délai, l'état des lieux est considéré comme accepté.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-rose-900/50 to-pink-900/50 rounded-3xl p-12 border border-rose-500/30"
          >
            <Sparkles className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Comparatif automatique avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Talok génère automatiquement le comparatif entrée/sortie et calcule
              les retenues sur le dépôt de garantie selon la grille de vétusté.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                Essayer gratuitement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
