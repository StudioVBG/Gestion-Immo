"use client";

/**
 * Guide Gestion Locative en SCI
 *
 * SEO: Cible "gestion SCI familiale", "SCI location"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  BookOpen,
  Clock,
  FileText,
  Scale,
  Building,
  Calculator,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

const CHAPTERS = [
  {
    number: 1,
    title: "Comprendre la SCI",
    description: "Structure juridique et fonctionnement",
    items: [
      "Définition et objet social d'une SCI",
      "SCI familiale vs SCI entre tiers",
      "Avantages et inconvénients de la SCI",
      "SCI à l'IR vs SCI à l'IS : différences clés",
    ],
  },
  {
    number: 2,
    title: "Créer une SCI",
    description: "Formalités de constitution",
    items: [
      "Rédaction des statuts (clauses essentielles)",
      "Apports en capital : numéraire et nature",
      "Immatriculation et formalités légales",
      "Coûts de création d'une SCI",
    ],
  },
  {
    number: 3,
    title: "Gérance et assemblées",
    description: "Administration quotidienne",
    items: [
      "Rôle et pouvoirs du gérant",
      "Assemblée générale ordinaire annuelle",
      "Assemblée générale extraordinaire",
      "Procès-verbaux et registre des décisions",
    ],
  },
  {
    number: 4,
    title: "Comptabilité de la SCI",
    description: "Obligations comptables",
    items: [
      "Tenue des comptes (SCI à l'IR)",
      "Comptabilité complète (SCI à l'IS)",
      "Bilan et compte de résultat",
      "Approbation des comptes en AG",
    ],
  },
  {
    number: 5,
    title: "Gestion des associés",
    description: "Droits et obligations",
    items: [
      "Répartition des bénéfices entre associés",
      "Compte courant d'associé",
      "Cession de parts sociales",
      "Entrée et sortie d'associés",
    ],
  },
  {
    number: 6,
    title: "Fiscalité de la SCI",
    description: "Impôts et déclarations",
    items: [
      "SCI à l'IR : revenus fonciers des associés",
      "SCI à l'IS : imposition des bénéfices",
      "Option pour l'IS : avantages et inconvénients",
      "Déclarations fiscales (2072, 2065, 2044...)",
    ],
  },
  {
    number: 7,
    title: "SCI et transmission",
    description: "Donation et succession",
    items: [
      "Avantages de la SCI pour la transmission",
      "Donation de parts avec réserve d'usufruit",
      "Démembrement des parts sociales",
      "Pacte Dutreil et SCI",
    ],
  },
];

export default function GuideGestionSCIPage() {
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
              href="/guides"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les guides
            </Link>

            <div className="max-w-4xl">
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-4">
                <Users className="w-3 h-3 mr-1" />
                Guide spécialisé
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Guide Gestion Locative en{" "}
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  SCI Familiale
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Multi-associés, assemblées générales, répartition des bénéfices.
                Le guide complet pour gérer votre SCI familiale en toute conformité.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">15 min de lecture</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">7 chapitres</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">Mis à jour 2026</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF
                </Button>
                <Link href="/solutions/sci-familiales">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    Talok pour les SCI
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sommaire */}
      <section className="py-12 border-y border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Sommaire</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHAPTERS.map((chapter) => (
                <a
                  key={chapter.number}
                  href={`#chapitre-${chapter.number}`}
                  className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                    {chapter.number}
                  </span>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-violet-300 transition-colors">
                      {chapter.title}
                    </h3>
                    <p className="text-sm text-slate-500">{chapter.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-violet-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Pourquoi créer une SCI familiale ?
                    </h3>
                    <p className="text-slate-300">
                      La SCI (Société Civile Immobilière) est un outil juridique
                      particulièrement adapté à la gestion d'un patrimoine immobilier
                      familial. Elle facilite la transmission, permet une gestion
                      collégiale et offre une flexibilité fiscale appréciable.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Chapters */}
            {CHAPTERS.map((chapter, index) => (
              <motion.div
                key={chapter.number}
                id={`chapitre-${chapter.number}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                        {chapter.number}
                      </span>
                      <div>
                        <CardTitle className="text-xl text-white">
                          {chapter.title}
                        </CardTitle>
                        <p className="text-slate-400 text-sm mt-1">
                          {chapter.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {chapter.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-violet-400" />
                    SCI à l'IR vs SCI à l'IS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400">Critère</th>
                          <th className="text-left py-3 px-4 text-violet-300">SCI à l'IR</th>
                          <th className="text-left py-3 px-4 text-purple-300">SCI à l'IS</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        <tr className="border-b border-slate-700/50">
                          <td className="py-3 px-4">Imposition</td>
                          <td className="py-3 px-4">Associés (revenus fonciers)</td>
                          <td className="py-3 px-4">Société (IS 15% puis 25%)</td>
                        </tr>
                        <tr className="border-b border-slate-700/50">
                          <td className="py-3 px-4">Amortissement</td>
                          <td className="py-3 px-4">Non</td>
                          <td className="py-3 px-4">Oui</td>
                        </tr>
                        <tr className="border-b border-slate-700/50">
                          <td className="py-3 px-4">Plus-value</td>
                          <td className="py-3 px-4">Régime des particuliers</td>
                          <td className="py-3 px-4">Régime des professionnels</td>
                        </tr>
                        <tr className="border-b border-slate-700/50">
                          <td className="py-3 px-4">Comptabilité</td>
                          <td className="py-3 px-4">Simplifiée</td>
                          <td className="py-3 px-4">Complète obligatoire</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Idéal pour</td>
                          <td className="py-3 px-4">Patrimoine familial</td>
                          <td className="py-3 px-4">Investissement locatif intensif</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Warning */}
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
                    Attention à l'abus de droit
                  </h3>
                  <p className="text-slate-300">
                    La SCI ne doit pas être utilisée uniquement pour des motifs fiscaux.
                    L'administration peut requalifier certains montages si l'objectif
                    principal est l'évasion fiscale. Consultez un expert-comptable ou
                    notaire pour structurer votre projet.
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
            <Building className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Talok gère votre SCI
            </h2>
            <p className="text-slate-300 mb-6">
              Multi-associés, répartition automatique des revenus, génération des
              documents comptables, préparation des AG. Talok simplifie la gestion
              de votre SCI familiale.
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
