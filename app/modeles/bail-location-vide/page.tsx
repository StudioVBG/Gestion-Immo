"use client";

/**
 * Modèle Bail Location Vide
 *
 * SEO: Cible "bail location vide gratuit", "contrat location nue"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Home,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Sparkles,
  Shield,
  Clock,
} from "lucide-react";

const MENTIONS_OBLIGATOIRES = [
  "Identité des parties (bailleur et locataire)",
  "Date de prise d'effet et durée du bail (3 ans minimum)",
  "Description du logement (adresse, surface, équipements)",
  "Désignation des locaux et équipements d'usage privatif ou commun",
  "Montant du loyer et modalités de paiement",
  "Montant du dépôt de garantie (1 mois max)",
  "Modalités de révision du loyer (IRL)",
  "Montant du loyer du précédent locataire",
  "Nature et montant des charges récupérables",
  "Liste des diagnostics techniques obligatoires",
];

const ANNEXES_OBLIGATOIRES = [
  "Notice d'information (droits et devoirs des parties)",
  "État des lieux d'entrée",
  "Diagnostics techniques (DPE, électricité, gaz, plomb, ERP...)",
  "Règlement de copropriété (extraits)",
  "Attestation d'assurance du locataire",
];

const CARACTERISTIQUES = [
  { label: "Durée du bail", value: "3 ans (6 ans si personne morale)" },
  { label: "Dépôt de garantie", value: "1 mois de loyer max" },
  { label: "Préavis bailleur", value: "6 mois avant fin de bail" },
  { label: "Préavis locataire", value: "3 mois (1 mois en zone tendue)" },
  { label: "Révision du loyer", value: "Annuelle selon IRL" },
  { label: "Renouvellement", value: "Tacite reconduction" },
];

export default function ModeleBailLocationVidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Home className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Populaire
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Modèle{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Bail Location Vide
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Contrat type conforme à la loi ALUR pour location nue. Toutes les
                clauses obligatoires et annexes requises incluses.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Conforme loi ALUR</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Durée 3 ans</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">3 200 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
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
                Caractéristiques du bail vide
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

      {/* Mentions obligatoires */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-400" />
                      Mentions obligatoires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {MENTIONS_OBLIGATOIRES.map((mention, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          {mention}
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
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Annexes obligatoires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {ANNEXES_OBLIGATOIRES.map((annexe, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {annexe}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-300">
                        Le non-respect des annexes obligatoires peut entraîner
                        la nullité du bail ou réduire sa force juridique.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Avertissement */}
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
                    Zones avec encadrement des loyers
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Dans certaines villes (Paris, Lyon, Lille, Bordeaux, Montpellier...),
                    le loyer est encadré. Le bail doit mentionner le loyer de référence
                    et le loyer de référence majoré. Vérifiez si votre commune est concernée.
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-3xl p-12 border border-blue-500/30"
          >
            <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Générez vos baux automatiquement
            </h2>
            <p className="text-slate-300 mb-6">
              Avec Talok, créez des baux conformes pré-remplis avec les données
              de vos biens et locataires. Signature électronique incluse.
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
