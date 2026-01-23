"use client";

/**
 * Modèle Congé Donné par le Locataire
 *
 * SEO: Cible "lettre préavis locataire", "modèle résiliation bail"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
} from "lucide-react";

const PREAVIS_REDUIT = [
  {
    motif: "Zone tendue",
    delai: "1 mois",
    justificatif: "Attestation de la commune",
  },
  {
    motif: "Mutation professionnelle",
    delai: "1 mois",
    justificatif: "Lettre de l'employeur",
  },
  {
    motif: "Perte d'emploi",
    delai: "1 mois",
    justificatif: "Lettre de licenciement ou attestation Pôle Emploi",
  },
  {
    motif: "Nouvel emploi après perte d'emploi",
    delai: "1 mois",
    justificatif: "Contrat de travail",
  },
  {
    motif: "État de santé (+ 60 ans)",
    delai: "1 mois",
    justificatif: "Certificat médical",
  },
  {
    motif: "Bénéficiaire RSA ou AAH",
    delai: "1 mois",
    justificatif: "Attestation CAF",
  },
  {
    motif: "Attribution logement social",
    delai: "1 mois",
    justificatif: "Notification d'attribution",
  },
  {
    motif: "Premier emploi",
    delai: "1 mois",
    justificatif: "Contrat de travail",
  },
];

const DELAIS_STANDARDS = [
  { type: "Location vide (hors zone tendue)", delai: "3 mois" },
  { type: "Location vide (zone tendue)", delai: "1 mois" },
  { type: "Location meublée", delai: "1 mois" },
  { type: "Bail mobilité", delai: "1 mois" },
];

export default function ModeleLettreCongLocatairePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  <Mail className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Congé Donné par le{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Locataire
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Modèle de lettre de préavis pour mettre fin à votre bail. Préavis
                standard de 3 mois ou réduit à 1 mois selon votre situation.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white">1 ou 3 mois de préavis</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white">1 400 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
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

      {/* Délais standards */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Délais de préavis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {DELAIS_STANDARDS.map((item) => (
                  <Card key={item.type} className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-slate-400 mb-2">{item.type}</p>
                      <p className="text-2xl font-bold text-cyan-400">{item.delai}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Préavis réduit */}
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
                Cas de préavis réduit à 1 mois
              </h2>
              <p className="text-slate-400">
                Même hors zone tendue, le locataire peut bénéficier d'un préavis réduit
              </p>
            </motion.div>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {PREAVIS_REDUIT.map((item, i) => (
                    <div
                      key={item.motif}
                      className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pb-4 border-b border-slate-700/50 last:border-0"
                    >
                      <div className="flex items-center gap-2 md:w-1/3">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-medium">{item.motif}</span>
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 w-fit">
                        {item.delai}
                      </Badge>
                      <span className="text-sm text-slate-400 md:flex-1">
                        Justificatif : {item.justificatif}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                    Points importants
                  </h3>
                  <ul className="text-slate-300 text-sm space-y-2">
                    <li>• Le préavis court à compter de la <strong className="text-white">réception</strong> du courrier par le bailleur</li>
                    <li>• Envoyez votre congé par <strong className="text-white">lettre recommandée avec AR</strong></li>
                    <li>• Joignez les justificatifs si vous demandez un préavis réduit</li>
                    <li>• Le loyer reste dû pendant toute la durée du préavis</li>
                    <li>• Vous pouvez quitter le logement avant la fin du préavis (loyer dû jusqu'au départ si relogé)</li>
                  </ul>
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-cyan-900/50 to-teal-900/50 rounded-3xl p-12 border border-cyan-500/30"
          >
            <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Suivez vos préavis avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Talok calcule automatiquement les dates de fin de préavis et vous
              accompagne dans toutes les étapes du départ du locataire.
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
