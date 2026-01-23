"use client";

/**
 * Guide État des Lieux Parfait
 *
 * SEO: Cible "état des lieux conseils", "EDL entrée sortie"
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
  Clock,
  FileText,
  Camera,
  AlertTriangle,
  Lightbulb,
  XCircle,
  Shield,
} from "lucide-react";

const SECTIONS = [
  {
    title: "Avant l'état des lieux",
    items: [
      "Imprimer ou préparer le formulaire numérique",
      "Préparer un appareil photo (smartphone suffit)",
      "Vérifier le fonctionnement des compteurs",
      "S'assurer que le logement est vide et propre",
      "Prévoir suffisamment de temps (min 30-45 min)",
      "Faire l'EDL en plein jour si possible",
    ],
  },
  {
    title: "Pièce par pièce",
    items: [
      "Sol : état, rayures, taches, type de revêtement",
      "Murs : état, fissures, trous, papier peint ou peinture",
      "Plafond : état, traces d'humidité, fissures",
      "Portes : état, fonctionnement, serrures, poignées",
      "Fenêtres : état, joints, fonctionnement, vitrage",
      "Volets/stores : état, fonctionnement",
      "Prises et interrupteurs : état, fonctionnement",
      "Radiateurs : état, fonctionnement, purge",
    ],
  },
  {
    title: "Équipements à vérifier",
    items: [
      "Robinetterie : état, fonctionnement, fuites",
      "Sanitaires : WC, lavabo, baignoire/douche",
      "Cuisine : évier, plaques, four, hotte, réfrigérateur",
      "Chauffe-eau / chaudière : état, fonctionnement",
      "VMC : fonctionnement dans chaque pièce",
      "Interphone / digicode : fonctionnement",
      "Détecteur de fumée : présence et fonctionnement",
    ],
  },
  {
    title: "Relevés obligatoires",
    items: [
      "Compteur électrique : numéro et index",
      "Compteur gaz : numéro et index (si applicable)",
      "Compteur eau : index (si compteur individuel)",
      "Nombre de clés remises (entrée, cave, boîte aux lettres)",
      "Nombre de badges / télécommandes",
    ],
  },
];

const MISTAKES = [
  {
    mistake: "EDL trop rapide",
    consequence: "Défauts non relevés = à votre charge à la sortie",
    solution: "Prenez votre temps, vérifiez chaque élément",
  },
  {
    mistake: "Pas de photos",
    consequence: "Difficile de prouver l'état initial en cas de litige",
    solution: "Photographiez tout, datez les photos",
  },
  {
    mistake: "Termes vagues",
    consequence: "\"Bon état\" ne veut rien dire juridiquement",
    solution: "Soyez précis : \"3 rayures de 5cm sur parquet\"",
  },
  {
    mistake: "Oublier les équipements",
    consequence: "Équipement manquant non réclamable",
    solution: "Listez et testez chaque équipement",
  },
  {
    mistake: "Ne pas faire signer",
    consequence: "EDL non opposable au locataire",
    solution: "Signature des deux parties obligatoire",
  },
];

const VETUSTE = [
  { element: "Peinture / papier peint", duree: "7-10 ans" },
  { element: "Moquette", duree: "7 ans" },
  { element: "Parquet", duree: "15-20 ans" },
  { element: "Carrelage", duree: "20-25 ans" },
  { element: "Robinetterie", duree: "10 ans" },
  { element: "Chauffe-eau", duree: "10-15 ans" },
  { element: "Volets roulants", duree: "15-20 ans" },
  { element: "Électroménager", duree: "7-10 ans" },
];

export default function GuideEtatDesLieuxParfaitPage() {
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
              href="/guides"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les guides
            </Link>

            <div className="max-w-4xl">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-4">
                <ClipboardCheck className="w-3 h-3 mr-1" />
                Guide pratique
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Guide de l'État des Lieux{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Parfait
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Conseils d'experts pour réaliser des états des lieux complets,
                conformes au décret 2016, et éviter les litiges à la sortie.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">12 min de lecture</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">Avec photos exemples</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF
                </Button>
                <Link href="/modeles/etat-des-lieux-entree">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    Modèle EDL gratuit
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
              className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <Lightbulb className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Pourquoi l'EDL est crucial
                  </h3>
                  <p className="text-slate-300">
                    L'état des lieux est le seul document qui fait foi pour déterminer
                    les dégradations imputables au locataire. Un EDL bâclé à l'entrée
                    peut vous coûter des milliers d'euros à la sortie. Depuis le décret
                    du 30 mars 2016, le contenu de l'EDL est encadré par la loi.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Checklist sections */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {SECTIONS.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {index + 1}
                      </span>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
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
      </section>

      {/* Erreurs courantes */}
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
                Les 5 erreurs qui coûtent cher
              </h2>
              <p className="text-slate-400">
                Évitez ces pièges fréquents lors de vos états des lieux
              </p>
            </motion.div>

            <div className="space-y-4">
              {MISTAKES.map((item, index) => (
                <motion.div
                  key={item.mistake}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 md:w-1/3">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="font-medium text-white">{item.mistake}</span>
                        </div>
                        <div className="md:w-1/3 text-slate-400 text-sm">
                          → {item.consequence}
                        </div>
                        <div className="md:w-1/3 flex items-center gap-2 text-emerald-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          {item.solution}
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

      {/* Grille de vétusté */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Grille de vétusté indicative
                  </CardTitle>
                  <p className="text-slate-400 text-sm mt-2">
                    La vétusté correspond à l'usure normale d'un équipement dans le temps.
                    Elle ne peut pas être facturée au locataire.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400">Élément</th>
                          <th className="text-left py-3 px-4 text-slate-400">Durée de vie moyenne</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        {VETUSTE.map((item, i) => (
                          <tr key={i} className="border-b border-slate-700/50">
                            <td className="py-3 px-4">{item.element}</td>
                            <td className="py-3 px-4 text-indigo-300">{item.duree}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    * Ces durées sont indicatives. Une grille de vétusté peut être annexée au bail
                    par accord entre les parties.
                  </p>
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
                    EDL de sortie : délais légaux
                  </h3>
                  <p className="text-slate-300">
                    Le locataire dispose de <strong className="text-white">10 jours</strong> après
                    l'EDL de sortie pour contester les observations. Si l'EDL d'entrée est incomplet,
                    le logement est présumé avoir été remis en bon état au locataire.
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
            <ClipboardCheck className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              EDL numériques avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Réalisez vos états des lieux sur smartphone ou tablette. Photos intégrées,
              signature électronique, comparatif entrée/sortie automatique.
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
