"use client";

/**
 * Checklist Fin de Bail
 *
 * SEO: Cible "fin de bail locataire", "départ locataire étapes"
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
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Euro,
  AlertCircle,
  Sparkles,
  Home,
} from "lucide-react";

const CHECKLIST_SECTIONS = [
  {
    title: "Réception du congé",
    subtitle: "Vérifier la validité du préavis",
    timing: "Dès réception",
    items: [
      { text: "Vérifier la date d'envoi du courrier (cachet de la poste)", required: true },
      { text: "Vérifier le mode d'envoi (RAR, acte d'huissier, remise en main propre)", required: true },
      { text: "Calculer la durée du préavis applicable (1 ou 3 mois)", required: true },
      { text: "Identifier si motif de préavis réduit (mutation, perte emploi, RSA, zone tendue...)", required: false },
      { text: "Confirmer la date de fin de bail par écrit au locataire", required: false },
      { text: "Demander une adresse de réexpédition", required: false },
    ],
  },
  {
    title: "Pendant le préavis",
    subtitle: "Préparer la transition",
    timing: "Pendant le préavis",
    items: [
      { text: "Organiser les visites pour relocation (avec accord du locataire)", required: false },
      { text: "Vérifier le paiement du loyer pendant le préavis", required: true },
      { text: "Rappeler les obligations d'entretien avant départ", required: false },
      { text: "Planifier la date de l'état des lieux de sortie", required: true },
      { text: "Préparer le comparatif avec l'EDL d'entrée", required: true },
      { text: "Contacter les fournisseurs pour relevés de compteurs", required: false },
    ],
  },
  {
    title: "État des lieux de sortie",
    subtitle: "Le jour du départ",
    timing: "Jour de sortie",
    items: [
      { text: "Vérifier que le logement est entièrement vide", required: true },
      { text: "Réaliser l'EDL de sortie pièce par pièce", required: true },
      { text: "Comparer avec l'EDL d'entrée point par point", required: true },
      { text: "Appliquer la grille de vétusté si annexée au bail", required: false },
      { text: "Relever les index des compteurs (eau, électricité, gaz)", required: true },
      { text: "Récupérer toutes les clés, badges et télécommandes", required: true },
      { text: "Faire signer l'EDL par les deux parties", required: true },
      { text: "Prendre des photos datées de tout le logement", required: false },
    ],
  },
  {
    title: "Restitution du dépôt",
    subtitle: "Solder les comptes",
    timing: "1 à 2 mois max",
    items: [
      { text: "Calculer le montant des retenues éventuelles", required: true },
      { text: "Rassembler les factures justificatives (réparations, ménage...)", required: true },
      { text: "Établir le décompte détaillé des retenues", required: true },
      { text: "Calculer la régularisation des charges", required: true },
      { text: "Provisionner 20% pour charges si copropriété (arrêté non voté)", required: false },
      { text: "Restituer le solde dans le délai légal", required: true },
      { text: "Envoyer le courrier de restitution avec décompte", required: true },
    ],
  },
];

const DELAIS = [
  {
    situation: "EDL conforme (aucune dégradation)",
    delai: "1 mois",
    description: "Dépôt restitué intégralement",
  },
  {
    situation: "EDL avec dégradations",
    delai: "2 mois",
    description: "Retenues justifiées par factures",
  },
  {
    situation: "Retard de restitution",
    delai: "Pénalité 10%/mois",
    description: "Majoration automatique du montant dû",
  },
];

const RETENUES_POSSIBLES = [
  "Réparations locatives (dégradations hors vétusté)",
  "Ménage si logement rendu sale",
  "Remplacement clés perdues",
  "Loyers ou charges impayés",
  "Régularisation de charges",
  "Provision charges copropriété (20% max)",
];

export default function ChecklistFinBailPage() {
  const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const requiredItems = CHECKLIST_SECTIONS.reduce(
    (sum, s) => sum + s.items.filter((i) => i.required).length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-transparent to-transparent" />

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
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 mb-4">
                <ClipboardCheck className="w-3 h-3 mr-1" />
                Checklist pratique
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Checklist{" "}
                <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                  Fin de Bail
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Toutes les étapes du départ du locataire : préavis, état des lieux
                de sortie, restitution du dépôt de garantie. Ne rien oublier.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-white">{totalItems} points à vérifier</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white">{requiredItems} obligatoires</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-white">4 min de lecture</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Délais légaux */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Délais légaux de restitution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DELAIS.map((item) => (
                  <Card key={item.situation} className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-rose-400 mb-2">{item.delai}</p>
                        <p className="text-white font-medium mb-1">{item.situation}</p>
                        <p className="text-sm text-slate-400">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Checklist Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {CHECKLIST_SECTIONS.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.05 }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
                          {sectionIndex + 1}
                        </span>
                        <div>
                          <CardTitle className="text-xl text-white">
                            {section.title}
                          </CardTitle>
                          <p className="text-slate-400 text-sm">{section.subtitle}</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-700/50 text-slate-300">
                        <Calendar className="w-3 h-3 mr-1" />
                        {section.timing}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                          <span className="flex-1">{item.text}</span>
                          {item.required && (
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                              Obligatoire
                            </Badge>
                          )}
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

      {/* Retenues possibles */}
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
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Euro className="w-5 h-5 text-rose-400" />
                    Retenues possibles sur le dépôt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {RETENUES_POSSIBLES.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-rose-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-300">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Toute retenue doit être justifiée par une facture ou un devis.
                      À défaut, le locataire peut contester.
                    </p>
                  </div>
                </CardContent>
              </Card>
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-rose-900/50 to-pink-900/50 rounded-3xl p-12 border border-rose-500/30"
          >
            <Sparkles className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Simplifiez les fins de bail avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              EDL de sortie numérique avec comparatif automatique, calcul des retenues,
              génération du courrier de restitution. Talok gère tout.
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
