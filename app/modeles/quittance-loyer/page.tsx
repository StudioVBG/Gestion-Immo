"use client";

/**
 * Modèle Quittance de Loyer
 *
 * SEO: Cible "quittance de loyer gratuite", "modèle quittance"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Receipt,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Sparkles,
  Shield,
} from "lucide-react";

const MENTIONS_OBLIGATOIRES = [
  "Nom et adresse du bailleur",
  "Nom et adresse du locataire",
  "Adresse du bien loué",
  "Période concernée (mois, année)",
  "Montant du loyer hors charges",
  "Montant des charges (provision ou forfait)",
  "Montant total payé",
  "Date du paiement",
  "Signature du bailleur",
];

const FAQ = [
  {
    question: "Le bailleur est-il obligé de fournir une quittance ?",
    answer: "Oui, si le locataire la demande et que le loyer est payé en totalité. Le bailleur ne peut pas facturer la quittance (art. 21 loi du 6 juillet 1989).",
  },
  {
    question: "Quelle est la différence entre quittance et reçu ?",
    answer: "La quittance atteste du paiement total du loyer et des charges. Le reçu concerne un paiement partiel (acompte).",
  },
  {
    question: "Peut-on envoyer une quittance par email ?",
    answer: "Oui, avec l'accord du locataire. La quittance électronique a la même valeur juridique que le papier.",
  },
  {
    question: "Combien de temps conserver les quittances ?",
    answer: "Le locataire doit les conserver 3 ans minimum (délai de prescription des loyers). Nous recommandons 5 ans.",
  },
];

export default function ModeleQuittanceLoyerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  <Receipt className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Populaire
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Modèle{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Quittance de Loyer
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Modèle de quittance de loyer conforme à la loi ALUR avec toutes les
                mentions obligatoires. Téléchargement gratuit en PDF et Word.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">Conforme loi ALUR</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">PDF & Word</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">6 200 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
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

      {/* Aperçu du document */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Document preview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white text-slate-900 p-6 shadow-2xl">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold">QUITTANCE DE LOYER</h2>
                    <p className="text-sm text-slate-500">Mois de janvier 2026</p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Bailleur :</p>
                        <p className="text-slate-600">[Nom du bailleur]</p>
                        <p className="text-slate-600">[Adresse]</p>
                      </div>
                      <div>
                        <p className="font-semibold">Locataire :</p>
                        <p className="text-slate-600">[Nom du locataire]</p>
                        <p className="text-slate-600">[Adresse du bien]</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <p className="font-semibold mb-2">Détail du paiement :</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Loyer hors charges</span>
                          <span>[Montant] €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Charges</span>
                          <span>[Montant] €</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-2">
                          <span>Total payé</span>
                          <span>[Total] €</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
                      <p>Date du paiement : [Date]</p>
                      <p className="mt-4">Fait à [Ville], le [Date]</p>
                      <p className="mt-2">Signature du bailleur</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Mentions obligatoires */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50 h-full">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Mentions obligatoires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {MENTIONS_OBLIGATOIRES.map((mention, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          {mention}
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

      {/* Cadre légal */}
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
                    Cadre légal
                  </h3>
                  <p className="text-slate-300 text-sm">
                    La quittance de loyer est encadrée par l'article 21 de la loi du 6 juillet 1989.
                    Le bailleur doit la fournir gratuitement sur demande du locataire, à condition
                    que le loyer ait été payé intégralement. Aucun frais ne peut être facturé
                    pour la délivrance de ce document.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-8">
                Questions fréquentes
              </h2>
              <div className="space-y-4">
                {FAQ.map((item, i) => (
                  <Card key={i} className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-white mb-2">{item.question}</h3>
                      <p className="text-slate-400 text-sm">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-3xl p-12 border border-emerald-500/30"
          >
            <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Générez vos quittances automatiquement
            </h2>
            <p className="text-slate-300 mb-6">
              Avec Talok, les quittances sont générées et envoyées automatiquement
              chaque mois. Plus besoin de remplir de modèle manuellement.
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
