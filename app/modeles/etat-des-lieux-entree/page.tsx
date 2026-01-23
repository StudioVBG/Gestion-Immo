"use client";

/**
 * Modèle État des Lieux d'Entrée
 *
 * SEO: Cible "état des lieux entrée gratuit", "modèle EDL"
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
  Camera,
} from "lucide-react";

const CONTENU_EDL = [
  {
    section: "Informations générales",
    items: [
      "Type d'EDL (entrée ou sortie)",
      "Date de l'état des lieux",
      "Localisation du bien (adresse complète)",
      "Nom et coordonnées du bailleur",
      "Nom et coordonnées du locataire",
      "Relevés des compteurs (eau, électricité, gaz)",
    ],
  },
  {
    section: "Description du logement",
    items: [
      "Nombre de pièces et nature",
      "Revêtements (sols, murs, plafonds)",
      "Équipements de chaque pièce",
      "État des menuiseries (portes, fenêtres)",
      "État des installations (électricité, plomberie)",
    ],
  },
  {
    section: "Parties privatives",
    items: [
      "Cave, grenier, parking",
      "Jardin, terrasse, balcon",
      "Annexes éventuelles",
    ],
  },
  {
    section: "Éléments de clôture",
    items: [
      "Nombre et nature des clés remises",
      "Badges, télécommandes, codes",
      "Signatures des parties",
      "Mention de remise d'exemplaire",
    ],
  },
];

const PIECES_TYPE = [
  "Entrée",
  "Séjour / Salon",
  "Cuisine",
  "Chambre 1",
  "Chambre 2",
  "Chambre 3",
  "Salle de bain",
  "WC",
  "Couloir",
  "Dégagement",
  "Cave",
  "Garage / Parking",
];

export default function ModeleEtatDesLieuxEntreePage() {
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
                  <ClipboardCheck className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Populaire
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Modèle{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  État des Lieux d'Entrée
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Grille complète pièce par pièce, conforme au décret du 30 mars 2016.
                Toutes les mentions obligatoires pour un EDL protecteur.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">Conforme décret 2016</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">PDF imprimable</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">4 100 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF
                </Button>
                <Link href="/guides/etat-des-lieux-parfait">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    Guide de l'EDL parfait
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contenu du document */}
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
                Contenu du modèle
              </h2>
              <p className="text-slate-400">
                Un EDL complet pour décrire chaque élément du logement
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CONTENU_EDL.map((section, index) => (
                <motion.div
                  key={section.section}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-slate-800/30 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        {section.section}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
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

      {/* Pièces couvertes */}
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
                    Pièces couvertes par le modèle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {PIECES_TYPE.map((piece) => (
                      <Badge
                        key={piece}
                        className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      >
                        {piece}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 mt-4">
                    Le modèle inclut une fiche détaillée pour chaque pièce avec grille
                    d'évaluation (sols, murs, plafond, menuiseries, équipements).
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Conseils photos */}
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
                    <Camera className="w-5 h-5 text-indigo-400" />
                    Conseil : complétez par des photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 mb-4">
                    Un EDL écrit, même détaillé, peut être contesté. Les photos datées
                    constituent une preuve complémentaire précieuse en cas de litige.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      Photographiez chaque pièce en vue large
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      Zoomez sur les défauts existants
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      Photographiez les compteurs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      Horodatez vos photos
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
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
                    Obligation légale
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Le décret n°2016-382 du 30 mars 2016 impose un contenu minimum pour
                    les états des lieux. En l'absence d'EDL d'entrée, le logement est
                    présumé avoir été remis en bon état au locataire (article 3-2 de la
                    loi du 6 juillet 1989).
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-indigo-900/50 to-violet-900/50 rounded-3xl p-12 border border-indigo-500/30"
          >
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              EDL numériques avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Réalisez vos états des lieux sur tablette ou smartphone. Photos intégrées,
              signature électronique, PDF généré automatiquement.
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
