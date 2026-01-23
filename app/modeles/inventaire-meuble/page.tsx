"use client";

/**
 * Modèle Inventaire du Mobilier
 *
 * SEO: Cible "inventaire mobilier location meublée", "liste meuble location"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sofa,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
} from "lucide-react";

const MOBILIER_PAR_PIECE = [
  {
    piece: "Chambre",
    elements: [
      "Lit avec sommier et matelas",
      "Couette ou couverture",
      "Oreillers",
      "Table de chevet",
      "Armoire ou penderie",
      "Rideaux ou volets occultants",
      "Lampe de chevet",
    ],
  },
  {
    piece: "Séjour / Salon",
    elements: [
      "Canapé",
      "Table basse",
      "Table à manger",
      "Chaises (nombre)",
      "Meuble TV",
      "Étagères / bibliothèque",
      "Rideaux",
      "Luminaires",
    ],
  },
  {
    piece: "Cuisine",
    elements: [
      "Plaques de cuisson",
      "Four ou micro-ondes",
      "Réfrigérateur avec freezer",
      "Hotte ou extracteur",
      "Vaisselle (assiettes, verres, couverts)",
      "Casseroles et poêles",
      "Ustensiles de cuisine",
      "Poubelle",
    ],
  },
  {
    piece: "Salle de bain",
    elements: [
      "Miroir",
      "Rangements",
      "Porte-serviettes",
      "Tapis de bain",
      "Rideau de douche",
    ],
  },
  {
    piece: "Entrée / Divers",
    elements: [
      "Porte-manteau",
      "Miroir",
      "Meuble à chaussures",
      "Aspirateur ou balai",
      "Fer à repasser et table",
      "Étendoir à linge",
    ],
  },
];

const ETATS_POSSIBLES = [
  { etat: "Neuf", description: "Jamais utilisé, emballage d'origine" },
  { etat: "Très bon état", description: "Comme neuf, aucune trace d'usure" },
  { etat: "Bon état", description: "Usure légère, parfaitement fonctionnel" },
  { etat: "État correct", description: "Usure visible mais fonctionnel" },
  { etat: "État passable", description: "Usure importante, fonctionne encore" },
];

export default function ModeleInventaireMeublePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  <Sofa className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Inventaire du{" "}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Mobilier
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Liste détaillée obligatoire pour toute location meublée. Décrivez
                chaque équipement avec son état pour éviter les litiges.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white">Annexe obligatoire au bail</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white">720 téléchargements/mois</span>
                </div>
              </div>

              <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le PDF
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contenu par pièce */}
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
                Une liste complète pièce par pièce avec espace pour l'état et les observations
              </p>
            </motion.div>

            <div className="space-y-6">
              {MOBILIER_PAR_PIECE.map((piece, index) => (
                <motion.div
                  key={piece.piece}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">{piece.piece}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {piece.elements.map((element, i) => (
                          <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            {element}
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

      {/* Grille d'état */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Comment qualifier l'état ?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ETATS_POSSIBLES.map((item) => (
                      <div key={item.etat} className="flex items-center gap-4">
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 w-28 justify-center">
                          {item.etat}
                        </Badge>
                        <span className="text-sm text-slate-400">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                    Obligation légale
                  </h3>
                  <p className="text-slate-300 text-sm">
                    L'inventaire du mobilier est <strong className="text-white">obligatoire</strong> pour
                    toute location meublée (décret du 31 juillet 2015). Il doit être annexé au
                    bail et signé par les deux parties. Sans inventaire, vous ne pourrez pas
                    prouver la présence des équipements en cas de litige à la sortie.
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-amber-900/50 to-orange-900/50 rounded-3xl p-12 border border-amber-500/30"
          >
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Inventaire automatique avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Créez votre inventaire en quelques clics avec photos intégrées.
              Talok génère le PDF et l'annexe automatiquement au bail.
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
