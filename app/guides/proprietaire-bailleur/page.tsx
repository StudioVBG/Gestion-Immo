"use client";

/**
 * Guide Complet du Propriétaire Bailleur 2026
 *
 * SEO: Cible "guide propriétaire bailleur", "devenir bailleur"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  BookOpen,
  Clock,
  FileText,
  Users,
  Calculator,
  Shield,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

const CHAPTERS = [
  {
    number: 1,
    title: "Préparer son bien à la location",
    description: "Diagnostics obligatoires, travaux à prévoir, fixation du loyer",
    items: [
      "Les 7 diagnostics immobiliers obligatoires",
      "Travaux de mise aux normes (électricité, gaz, décence)",
      "Comment fixer un loyer attractif et rentable",
      "Zones tendues : encadrement des loyers",
    ],
  },
  {
    number: 2,
    title: "Trouver le bon locataire",
    description: "Annonces, visites, sélection du dossier",
    items: [
      "Rédiger une annonce efficace",
      "Organiser les visites (individuelles vs groupées)",
      "Les pièces justificatives autorisées",
      "Analyser un dossier de location",
      "Les critères de discrimination interdits",
    ],
  },
  {
    number: 3,
    title: "Signer le bail",
    description: "Types de baux, clauses obligatoires, annexes",
    items: [
      "Location vide vs meublée : différences clés",
      "Le contrat type loi ALUR",
      "Clauses obligatoires et interdites",
      "Les annexes au bail (diagnostics, règlement...)",
      "Signature électronique : validité juridique",
    ],
  },
  {
    number: 4,
    title: "L'état des lieux d'entrée",
    description: "Méthodologie pour un EDL complet et protecteur",
    items: [
      "Décret 2016 : les mentions obligatoires",
      "Grille de vétusté : comment l'appliquer",
      "Documenter avec photos et vidéos",
      "Les erreurs qui coûtent cher",
    ],
  },
  {
    number: 5,
    title: "Gérer au quotidien",
    description: "Loyers, charges, réparations, relations locataire",
    items: [
      "Émettre les quittances de loyer",
      "Réviser le loyer (IRL)",
      "Régularisation annuelle des charges",
      "Réparations : qui paie quoi ?",
      "Gérer les demandes du locataire",
    ],
  },
  {
    number: 6,
    title: "Impayés et litiges",
    description: "Prévention, relances, procédures",
    items: [
      "La garantie Visale et GLI",
      "Relance amiable : les bons réflexes",
      "Mise en demeure et commandement de payer",
      "La procédure d'expulsion (étapes et délais)",
      "Faire appel à un huissier",
    ],
  },
  {
    number: 7,
    title: "Fiscalité du bailleur",
    description: "Régimes fiscaux, déclarations, optimisation",
    items: [
      "Micro-foncier vs régime réel",
      "Le statut LMNP (meublé)",
      "Déficit foncier : mécanisme et plafonds",
      "Déclarer ses revenus locatifs (formulaires)",
      "Dispositifs de défiscalisation (Pinel, Denormandie)",
    ],
  },
  {
    number: 8,
    title: "Fin de bail et départ",
    description: "Préavis, état des lieux de sortie, restitution",
    items: [
      "Congé du locataire : délais et motifs réduits",
      "Congé du bailleur : vente, reprise, motif légitime",
      "État des lieux de sortie comparatif",
      "Retenues sur dépôt de garantie",
      "Délais de restitution (1 ou 2 mois)",
    ],
  },
];

const HIGHLIGHTS = [
  {
    icon: Clock,
    title: "Temps de lecture",
    value: "25 min",
  },
  {
    icon: FileText,
    title: "Chapitres",
    value: "8 parties",
  },
  {
    icon: CheckCircle2,
    title: "Mis à jour",
    value: "Janvier 2026",
  },
];

export default function GuideProprietaireBailleurPage() {
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
            {/* Breadcrumb */}
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les guides
            </Link>

            <div className="max-w-4xl">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-4">
                <BookOpen className="w-3 h-3 mr-1" />
                Guide complet
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Guide Complet du{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Propriétaire Bailleur
                </span>{" "}
                2026
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                De la préparation de votre bien au départ du locataire : tout ce que
                vous devez savoir pour louer sereinement et en conformité avec la loi.
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-4 mb-8">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2"
                  >
                    <item.icon className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-slate-400">{item.title} :</span>
                    <span className="text-sm text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le PDF
                </Button>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                    Essayer Talok gratuitement
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
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
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {chapter.number}
                  </span>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-indigo-300 transition-colors">
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
              className="prose prose-invert max-w-none"
            >
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mt-0 mb-2">
                      Pourquoi ce guide ?
                    </h3>
                    <p className="text-slate-300 m-0">
                      Être propriétaire bailleur, c'est exercer une activité encadrée par de
                      nombreuses lois (ALUR, ELAN, Climat et Résilience...). Ce guide vous
                      donne toutes les clés pour gérer vos locations en toute légalité,
                      protéger vos intérêts et éviter les erreurs coûteuses.
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
                      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
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

            {/* Warning Box */}
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
                    Attention aux évolutions légales
                  </h3>
                  <p className="text-slate-300">
                    La réglementation locative évolue régulièrement. Ce guide est mis à jour
                    en janvier 2026 mais nous vous recommandons de vérifier les dernières
                    actualités sur{" "}
                    <a
                      href="https://www.service-public.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline"
                    >
                      service-public.fr
                    </a>
                    .
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
            <Building className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Passez de la théorie à la pratique
            </h2>
            <p className="text-slate-300 mb-6">
              Talok automatise tout ce que vous avez appris dans ce guide : baux conformes,
              quittances automatiques, états des lieux numériques, comptabilité simplifiée.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                Essayer gratuitement pendant 30 jours
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Guides connexes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/guides/checklist-mise-en-location">
                <Card className="bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <Users className="w-8 h-8 text-indigo-400 mb-3" />
                    <h3 className="text-white font-semibold mb-2">Checklist Mise en Location</h3>
                    <p className="text-sm text-slate-400">Ne rien oublier avant de louer</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/guides/fiscalite-locative">
                <Card className="bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <Calculator className="w-8 h-8 text-indigo-400 mb-3" />
                    <h3 className="text-white font-semibold mb-2">Fiscalité Locative</h3>
                    <p className="text-sm text-slate-400">Optimiser votre imposition</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/guides/etat-des-lieux-parfait">
                <Card className="bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <Shield className="w-8 h-8 text-indigo-400 mb-3" />
                    <h3 className="text-white font-semibold mb-2">EDL Parfait</h3>
                    <p className="text-sm text-slate-400">Éviter les litiges</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
