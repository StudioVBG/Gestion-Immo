"use client";

/**
 * Modèle Acte de Caution Solidaire
 *
 * SEO: Cible "acte caution solidaire gratuit", "garant location"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  HandCoins,
  Users,
} from "lucide-react";

const MENTIONS_OBLIGATOIRES = [
  "Identité complète du garant (nom, prénom, date et lieu de naissance, adresse)",
  "Identité du locataire cautionné",
  "Adresse du logement concerné",
  "Nom et adresse du bailleur",
  "Montant du loyer et des charges",
  "Mention manuscrite du montant en chiffres et en lettres",
  "Durée de l'engagement (déterminée ou indéterminée)",
  "Mention de la solidarité avec le locataire",
  "Reproduction des articles 22-1 et 22-2 de la loi du 6 juillet 1989",
  "Date et signature manuscrite du garant",
];

const DIFFERENCES_CAUTIONS = [
  {
    type: "Caution simple",
    description: "Le bailleur doit d'abord poursuivre le locataire",
    avantage: "Protection du garant",
  },
  {
    type: "Caution solidaire",
    description: "Le bailleur peut poursuivre directement le garant",
    avantage: "Protection du bailleur",
  },
];

const ENGAGEMENT_OPTIONS = [
  {
    duree: "Durée déterminée",
    description: "L'engagement prend fin à une date précise",
    conseil: "Privilégier la durée du bail initial",
  },
  {
    duree: "Durée indéterminée",
    description: "L'engagement court jusqu'à résiliation",
    conseil: "Le garant peut résilier à tout moment avec préavis",
  },
];

export default function ModeleCautionSolidairePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Acte de{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Caution Solidaire
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Engagement du garant conforme à la loi ALUR. Document protecteur
                pour le bailleur avec toutes les mentions légales obligatoires.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">Conforme loi ALUR</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">1 100 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
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

      {/* Différence simple/solidaire */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Caution simple vs solidaire
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DIFFERENCES_CAUTIONS.map((item) => (
                  <Card key={item.type} className="bg-slate-800/30 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">{item.type}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-400 mb-4">{item.description}</p>
                      <Badge className={
                        item.type === "Caution solidaire"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                      }>
                        {item.avantage}
                      </Badge>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-indigo-500/10 border-indigo-500/30">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    Mentions obligatoires (loi ALUR)
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    L'absence d'une mention peut entraîner la nullité de l'acte
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MENTIONS_OBLIGATOIRES.map((mention, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        {mention}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Durée d'engagement */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Durée de l'engagement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ENGAGEMENT_OPTIONS.map((item) => (
                  <Card key={item.duree} className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">{item.duree}</h3>
                      <p className="text-slate-400 text-sm mb-4">{item.description}</p>
                      <p className="text-indigo-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        {item.conseil}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
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
                    Obligation d'information annuelle
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Le bailleur doit informer le garant chaque année du montant de la
                    dette locative (loyers impayés, charges). À défaut, le garant peut
                    se voir déchargé des pénalités et intérêts de retard.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visale alternative */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <HandCoins className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Alternative : la garantie Visale
                      </h3>
                      <p className="text-slate-300 text-sm mb-4">
                        Si votre locataire n'a pas de garant, la garantie Visale (Action
                        Logement) peut le remplacer gratuitement. Elle couvre les impayés
                        de loyer et les dégradations jusqu'à 36 mensualités.
                      </p>
                      <a
                        href="https://www.visale.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 text-sm hover:underline"
                      >
                        En savoir plus sur visale.fr →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-indigo-900/50 to-violet-900/50 rounded-3xl p-12 border border-indigo-500/30"
          >
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Gérez vos garants avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Talok stocke les informations de vos garants et vous permet de générer
              les actes de caution conformes en un clic.
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
