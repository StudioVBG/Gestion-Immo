"use client";

/**
 * Guide Investissement DOM-TOM
 *
 * SEO: Cible "investir immobilier Martinique", "Pinel Outre-Mer"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Palmtree,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Euro,
  Building,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Sun,
} from "lucide-react";

const TERRITOIRES = [
  { name: "Martinique", population: "368 000", tensionLocative: "Forte" },
  { name: "Guadeloupe", population: "384 000", tensionLocative: "Forte" },
  { name: "Guyane", population: "294 000", tensionLocative: "Très forte" },
  { name: "La Réunion", population: "860 000", tensionLocative: "Très forte" },
  { name: "Mayotte", population: "320 000", tensionLocative: "Très forte" },
  { name: "Nouvelle-Calédonie", population: "272 000", tensionLocative: "Modérée" },
  { name: "Polynésie française", population: "280 000", tensionLocative: "Modérée" },
];

const DISPOSITIFS = [
  {
    name: "Pinel Outre-Mer",
    reduction: "Jusqu'à 32%",
    duree: "6, 9 ou 12 ans",
    plafond: "300 000 €/an",
    avantages: [
      "Réduction d'impôt de 23% à 32% du prix",
      "Plafonds de loyers plus élevés qu'en métropole",
      "Cumul possible avec d'autres dispositifs",
      "Applicable au neuf et réhabilité",
    ],
    conditions: [
      "Engagement de location 6 à 12 ans",
      "Respect des plafonds de loyer",
      "Plafonds de ressources locataires",
      "Performance énergétique (RT2012 ou équivalent)",
    ],
  },
  {
    name: "Girardin Industriel",
    reduction: "110-120%",
    duree: "5 ans",
    plafond: "Variable",
    avantages: [
      "Réduction d'impôt supérieure à l'investissement",
      "Effet fiscal immédiat (one-shot)",
      "Pas de gestion locative",
      "Aide au développement économique local",
    ],
    conditions: [
      "Investissement dans l'outil productif",
      "Via société de portage agréée",
      "Engagement de 5 ans minimum",
      "Risque de requalification fiscale",
    ],
  },
  {
    name: "LMNP Outre-Mer",
    reduction: "Amortissement",
    duree: "Illimitée",
    plafond: "Aucun",
    avantages: [
      "Amortissement du bien (non imposé)",
      "Régime flexible, pas d'engagement de durée",
      "Revenus peu ou pas imposés",
      "Marché touristique porteur",
    ],
    conditions: [
      "Location meublée",
      "Inscription au RCS",
      "Comptabilité (expert recommandé)",
      "Revenus < 23 000 € ou < 50% des revenus",
    ],
  },
];

const SPECIFICITES = [
  {
    title: "Marché tendu",
    description: "Forte demande locative, offre insuffisante dans la plupart des DOM",
    icon: TrendingUp,
  },
  {
    title: "Risques climatiques",
    description: "Cyclones, séismes : assurance spécifique obligatoire",
    icon: AlertTriangle,
  },
  {
    title: "Coûts de construction",
    description: "+20 à 40% par rapport à la métropole (matériaux, main d'œuvre)",
    icon: Building,
  },
  {
    title: "Fiscalité avantageuse",
    description: "Réductions d'impôt majorées pour compenser les surcoûts",
    icon: Euro,
  },
];

export default function GuideInvestissementDOMTOMPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent" />

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
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 mb-4">
                <Palmtree className="w-3 h-3 mr-1" />
                Guide spécialisé
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Guide Investissement{" "}
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  DOM-TOM
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Pinel Outre-Mer, Girardin, spécificités locales. Tout savoir pour
                investir aux Antilles, à La Réunion et dans les territoires d'Outre-Mer.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-white">18 min de lecture</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-white">7 territoires couverts</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-white">Mis à jour 2026</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF
                </Button>
                <Link href="/solutions/dom-tom">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    Talok pour les DOM-TOM
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <Sun className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Pourquoi investir en Outre-Mer ?
                  </h3>
                  <p className="text-slate-300">
                    Les DOM-TOM offrent des opportunités uniques : marchés locatifs tendus,
                    dispositifs fiscaux très avantageux (Pinel majoré, Girardin), et une
                    demande de logements qui dépasse largement l'offre. Pour les investisseurs
                    métropolitains, c'est un moyen de diversifier son patrimoine tout en
                    bénéficiant de réductions d'impôt significatives.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Territoires */}
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
                Les territoires d'Outre-Mer
              </h2>
              <p className="text-slate-400">
                Chaque territoire a ses spécificités en termes de marché et de tension locative
              </p>
            </motion.div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Territoire</th>
                    <th className="text-left py-3 px-4 text-slate-400">Population</th>
                    <th className="text-left py-3 px-4 text-slate-400">Tension locative</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {TERRITOIRES.map((t) => (
                    <tr key={t.name} className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-medium text-white">{t.name}</td>
                      <td className="py-3 px-4">{t.population} hab.</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            t.tensionLocative === "Très forte"
                              ? "bg-red-500/20 text-red-300 border-red-500/30"
                              : t.tensionLocative === "Forte"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                          }
                        >
                          {t.tensionLocative}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Dispositifs fiscaux */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Les dispositifs de défiscalisation
              </h2>
              <p className="text-slate-400">
                Comparatif des principaux dispositifs pour investir en Outre-Mer
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {DISPOSITIFS.map((dispositif, index) => (
                <motion.div
                  key={dispositif.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-slate-800/30 border-slate-700/50">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl text-white">
                          {dispositif.name}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                          {dispositif.reduction}
                        </Badge>
                        <Badge className="bg-slate-700/50 text-slate-300">
                          {dispositif.duree}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400 mb-2">
                          Avantages
                        </h4>
                        <ul className="space-y-1">
                          {dispositif.avantages.map((item, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-amber-400 mb-2">
                          Conditions
                        </h4>
                        <ul className="space-y-1">
                          {dispositif.conditions.map((item, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-amber-400">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Spécificités */}
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
                Spécificités à connaître
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SPECIFICITES.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700/50 h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                          <p className="text-sm text-slate-400">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
                    Attention : gestion à distance
                  </h3>
                  <p className="text-slate-300">
                    Investir en Outre-Mer depuis la métropole nécessite une gestion rigoureuse.
                    Privilégiez un outil de gestion locative adapté ou un administrateur de biens
                    local de confiance. La distance et le décalage horaire peuvent compliquer
                    les relations avec les locataires.
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-teal-900/50 to-emerald-900/50 rounded-3xl p-12 border border-teal-500/30"
          >
            <Palmtree className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Talok, né en Martinique
            </h2>
            <p className="text-slate-300 mb-6">
              Talok est la seule solution de gestion locative conçue en Outre-Mer,
              par des propriétaires ultramarins, pour répondre aux spécificités locales :
              gestion multi-fuseaux, support en créole, connaissance du terrain.
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
