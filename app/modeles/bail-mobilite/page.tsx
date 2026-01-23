"use client";

/**
 * Modèle Bail Mobilité
 *
 * SEO: Cible "bail mobilité gratuit", "contrat mobilité"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Shield,
  Clock,
  GraduationCap,
  Plane,
} from "lucide-react";

const LOCATAIRES_ELIGIBLES = [
  { icon: GraduationCap, label: "Étudiant ou en formation professionnelle" },
  { icon: Briefcase, label: "En contrat d'apprentissage" },
  { icon: Briefcase, label: "En stage" },
  { icon: Plane, label: "En mutation ou mission temporaire" },
  { icon: Briefcase, label: "En service civique" },
  { icon: Briefcase, label: "En intérim ou CDD" },
];

const CARACTERISTIQUES = [
  { label: "Durée", value: "1 à 10 mois" },
  { label: "Dépôt de garantie", value: "Interdit" },
  { label: "Renouvellement", value: "Impossible" },
  { label: "Préavis locataire", value: "1 mois" },
  { label: "Garantie", value: "Visale recommandée" },
  { label: "Type de logement", value: "Meublé uniquement" },
];

const AVANTAGES = [
  "Pas de dépôt de garantie à verser",
  "Durée flexible adaptée à la mission",
  "Préavis court de 1 mois",
  "Garantie Visale gratuite et automatique",
];

const INCONVENIENTS = [
  "Réservé aux situations de mobilité professionnelle",
  "Pas de renouvellement possible",
  "Logement obligatoirement meublé",
  "Durée maximale de 10 mois",
];

export default function ModeleBailMobilitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Modèle{" "}
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Bail Mobilité
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Contrat de 1 à 10 mois pour locataires en mobilité professionnelle.
                Sans dépôt de garantie, idéal pour stages, missions et formations.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white">Loi ELAN 2018</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white">1 à 10 mois</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white">890 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger en PDF
                </Button>
                <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger en Word
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Caractéristiques */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Caractéristiques du bail mobilité
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CARACTERISTIQUES.map((item) => (
                  <Card key={item.label} className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-slate-400">{item.label}</p>
                      <p className="text-lg font-semibold text-white">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Locataires éligibles */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Qui peut bénéficier du bail mobilité ?
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    Le locataire doit justifier d'une situation de mobilité professionnelle
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {LOCATAIRES_ELIGIBLES.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-slate-300">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-orange-400" />
                        </div>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Avantages / Inconvénients */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Avantages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {AVANTAGES.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Limites
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {INCONVENIENTS.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                          <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Visale */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Garantie Visale : sécurisez votre bail mobilité
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Action Logement propose la garantie Visale gratuite pour les bails
                    mobilité. Elle couvre les impayés de loyer et dégradations jusqu'à
                    la fin du bail. Le locataire doit faire sa demande sur visale.fr
                    avant la signature du bail.
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-orange-900/50 to-amber-900/50 rounded-3xl p-12 border border-orange-500/30"
          >
            <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Gérez vos baux mobilité avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Talok gère tous les types de baux : vide, meublé, mobilité. Générez
              vos contrats conformes et suivez les échéances automatiquement.
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
