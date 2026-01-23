"use client";

/**
 * Guide Fiscalité Locative
 *
 * SEO: Cible "fiscalité revenus locatifs", "impôts location"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  BookOpen,
  Clock,
  FileText,
  TrendingDown,
  Building,
  AlertTriangle,
  Lightbulb,
  Euro,
} from "lucide-react";

const REGIMES = [
  {
    name: "Micro-foncier",
    seuil: "< 15 000 €/an",
    abattement: "30%",
    avantages: [
      "Simplicité : pas de comptabilité détaillée",
      "Abattement forfaitaire de 30%",
      "Déclaration sur 2042 (case 4BE)",
    ],
    inconvenients: [
      "Pas de déduction des charges réelles",
      "Pas de déficit foncier possible",
      "Non adapté si charges importantes",
    ],
    idealFor: "Propriétaires avec peu de charges et revenus < 15 000 €",
  },
  {
    name: "Régime réel",
    seuil: "Tous revenus",
    abattement: "Charges réelles",
    avantages: [
      "Déduction de toutes les charges réelles",
      "Déficit foncier imputable sur le revenu global",
      "Déduction des intérêts d'emprunt",
      "Déduction des travaux d'amélioration",
    ],
    inconvenients: [
      "Comptabilité détaillée obligatoire",
      "Déclaration 2044 à remplir",
      "Engagement de 3 ans minimum",
    ],
    idealFor: "Propriétaires avec travaux ou emprunts importants",
  },
  {
    name: "LMNP Micro-BIC",
    seuil: "< 77 700 €/an",
    abattement: "50%",
    avantages: [
      "Abattement forfaitaire de 50%",
      "Simplicité de déclaration",
      "Adapté aux meublés à faible charge",
    ],
    inconvenients: [
      "Pas de déduction des charges réelles",
      "Pas d'amortissement du bien",
    ],
    idealFor: "Location meublée occasionnelle, revenus modérés",
  },
  {
    name: "LMNP Réel",
    seuil: "Tous revenus",
    abattement: "Charges + amortissement",
    avantages: [
      "Amortissement du bien (non imposé)",
      "Déduction de toutes les charges",
      "Possibilité de déficit reportable",
      "Optimisation fiscale maximale",
    ],
    inconvenients: [
      "Comptabilité plus complexe",
      "Expert-comptable recommandé",
    ],
    idealFor: "Investisseurs cherchant à minimiser leur imposition",
  },
];

const DEDUCTIONS = [
  {
    category: "Charges courantes",
    items: [
      "Taxe foncière (hors TEOM)",
      "Charges de copropriété non récupérables",
      "Primes d'assurance (PNO, loyers impayés)",
      "Frais de gestion (agence, logiciel)",
      "Honoraires (comptable, avocat)",
    ],
  },
  {
    category: "Travaux déductibles",
    items: [
      "Travaux d'entretien et réparation",
      "Travaux d'amélioration (hors agrandissement)",
      "Ravalement de façade",
      "Remplacement chaudière, fenêtres",
      "Mise aux normes (électricité, plomberie)",
    ],
  },
  {
    category: "Frais financiers",
    items: [
      "Intérêts d'emprunt",
      "Frais de dossier bancaire",
      "Assurance emprunteur",
      "Frais de garantie (hypothèque, caution)",
    ],
  },
];

export default function GuideFiscaliteLocativePage() {
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
              href="/guides"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les guides
            </Link>

            <div className="max-w-4xl">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4">
                <Calculator className="w-3 h-3 mr-1" />
                Guide fiscal
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Tout sur la{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Fiscalité Locative
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Micro-foncier, régime réel, LMNP, déficit foncier. Comprenez les
                différents régimes fiscaux et optimisez votre imposition.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">20 min de lecture</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">4 régimes détaillés</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">Revenus 2025</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF
                </Button>
                <Link href="/outils/calcul-rendement-locatif">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    Calculer mon rendement
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Régimes comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Comparez les régimes fiscaux
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Chaque régime a ses avantages. Le choix dépend de votre situation :
                montant des revenus, charges, type de location.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {REGIMES.map((regime, index) => (
                <motion.div
                  key={regime.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-slate-800/30 border-slate-700/50">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl text-white">
                          {regime.name}
                        </CardTitle>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          {regime.abattement}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        Seuil : {regime.seuil}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400 mb-2">
                          ✓ Avantages
                        </h4>
                        <ul className="space-y-1">
                          {regime.avantages.map((item, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-amber-400 mb-2">
                          ✗ Inconvénients
                        </h4>
                        <ul className="space-y-1">
                          {regime.inconvenients.map((item, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-amber-400">−</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                        <p className="text-sm text-indigo-300">
                          <Lightbulb className="w-4 h-4 inline mr-1" />
                          {regime.idealFor}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Déductions */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Charges déductibles (régime réel)
              </h2>
              <p className="text-slate-400">
                En régime réel, vous pouvez déduire de nombreuses charges de vos revenus fonciers.
              </p>
            </motion.div>

            <div className="space-y-6">
              {DEDUCTIONS.map((section, index) => (
                <motion.div
                  key={section.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        {section.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Déficit foncier */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-8 h-8 text-emerald-400" />
                    <CardTitle className="text-2xl text-white">
                      Le déficit foncier
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300">
                    Quand vos charges déductibles dépassent vos revenus locatifs, vous
                    générez un déficit foncier. Ce déficit est imputable sur votre revenu
                    global dans la limite de <strong className="text-white">10 700 €/an</strong>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Exemple</h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>Loyers perçus : 12 000 €</li>
                        <li>Charges déductibles : 18 000 €</li>
                        <li>Déficit foncier : 6 000 €</li>
                        <li className="text-emerald-400">
                          → Imputable sur revenu global
                        </li>
                      </ul>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Conditions</h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Régime réel obligatoire</li>
                        <li>• Location jusqu'au 31/12 de la 3e année</li>
                        <li>• Déficit > 10 700 € reportable 10 ans</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Warning */}
      <section className="py-8">
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
                    Attention aux erreurs fréquentes
                  </h3>
                  <ul className="text-slate-300 space-y-2">
                    <li>• Ne pas confondre micro-foncier et régime réel : le choix est engageant</li>
                    <li>• Les travaux d'agrandissement ne sont pas déductibles</li>
                    <li>• La TEOM (taxe ordures ménagères) est récupérable sur le locataire</li>
                    <li>• En LMNP, pensez à vous immatriculer au Greffe</li>
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-3xl p-12 border border-emerald-500/30"
          >
            <Euro className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Simplifiez votre déclaration fiscale
            </h2>
            <p className="text-slate-300 mb-6">
              Talok calcule automatiquement vos revenus fonciers, génère votre
              récapitulatif annuel et prépare les données pour votre déclaration 2044.
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
