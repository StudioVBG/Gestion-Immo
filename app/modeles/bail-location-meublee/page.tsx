"use client";

/**
 * Modèle Bail Location Meublée
 *
 * SEO: Cible "bail meublé gratuit", "contrat location meublée"
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
  Sofa,
} from "lucide-react";

const MOBILIER_OBLIGATOIRE = [
  "Literie avec couette ou couverture",
  "Volets ou rideaux occultants dans les chambres",
  "Plaques de cuisson",
  "Four ou four micro-ondes",
  "Réfrigérateur avec compartiment congélation ou congélateur",
  "Vaisselle en quantité suffisante",
  "Ustensiles de cuisine",
  "Table et sièges",
  "Étagères de rangement",
  "Luminaires",
  "Matériel d'entretien ménager",
];

const CARACTERISTIQUES = [
  { label: "Durée du bail", value: "1 an (9 mois si étudiant)" },
  { label: "Dépôt de garantie", value: "2 mois de loyer max" },
  { label: "Préavis bailleur", value: "3 mois avant fin de bail" },
  { label: "Préavis locataire", value: "1 mois" },
  { label: "Révision du loyer", value: "Annuelle selon IRL" },
  { label: "Renouvellement", value: "Tacite reconduction" },
];

const DIFFERENCES_VIDE_MEUBLE = [
  { critere: "Durée bail", vide: "3 ans", meuble: "1 an" },
  { critere: "Dépôt de garantie", vide: "1 mois", meuble: "2 mois" },
  { critere: "Préavis locataire", vide: "3 mois (1 en zone tendue)", meuble: "1 mois" },
  { critere: "Préavis bailleur", vide: "6 mois", meuble: "3 mois" },
  { critere: "Inventaire mobilier", vide: "Non", meuble: "Obligatoire" },
  { critere: "Régime fiscal", vide: "Revenus fonciers", meuble: "BIC (LMNP)" },
];

export default function ModeleBailLocationMeubleePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                  <Sofa className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Modèle{" "}
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Bail Location Meublée
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Contrat type LMNP avec liste du mobilier obligatoire. Conforme au
                décret du 31 juillet 2015 définissant le logement meublé.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">Conforme loi ALUR</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">Durée 1 an</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">2 900 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
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
                Caractéristiques du bail meublé
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

      {/* Mobilier obligatoire */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-violet-500/10 border-violet-500/30">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Sofa className="w-5 h-5 text-violet-400" />
                    Mobilier obligatoire (décret 2015)
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    Pour être qualifié de "meublé", le logement doit comporter au minimum :
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MOBILIER_OBLIGATOIRE.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparatif vide/meublé */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Location vide vs meublée
              </h2>
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400">Critère</th>
                          <th className="text-left py-3 px-4 text-blue-300">Location vide</th>
                          <th className="text-left py-3 px-4 text-violet-300">Location meublée</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        {DIFFERENCES_VIDE_MEUBLE.map((row, i) => (
                          <tr key={i} className="border-b border-slate-700/50">
                            <td className="py-3 px-4 font-medium text-white">{row.critere}</td>
                            <td className="py-3 px-4">{row.vide}</td>
                            <td className="py-3 px-4">{row.meuble}</td>
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

      {/* Avertissement LMNP */}
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
                    Statut LMNP : formalités obligatoires
                  </h3>
                  <p className="text-slate-300 text-sm">
                    En tant que loueur en meublé non professionnel, vous devez vous
                    immatriculer auprès du Greffe du Tribunal de Commerce (formulaire P0i)
                    dans les 15 jours suivant le début de l'activité. Vous obtiendrez
                    un numéro SIRET indispensable pour vos déclarations fiscales.
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-3xl p-12 border border-violet-500/30"
          >
            <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Inventaire du mobilier automatique
            </h2>
            <p className="text-slate-300 mb-6">
              Talok génère automatiquement l'inventaire du mobilier annexé au bail,
              avec photos et état de chaque équipement.
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
