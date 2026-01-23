"use client";

/**
 * Checklist Mise en Location
 *
 * SEO: Cible "checklist mise en location", "étapes location appartement"
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
  Circle,
  Clock,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const CHECKLIST_SECTIONS = [
  {
    title: "Avant la mise en location",
    subtitle: "Préparer votre bien",
    items: [
      { text: "Diagnostic de Performance Énergétique (DPE)", required: true },
      { text: "Diagnostic Électricité (si installation > 15 ans)", required: true },
      { text: "Diagnostic Gaz (si installation > 15 ans)", required: true },
      { text: "Constat de Risque d'Exposition au Plomb (CREP)", required: true },
      { text: "État des Risques et Pollutions (ERP)", required: true },
      { text: "Diagnostic Bruit (si zone aéroportuaire)", required: false },
      { text: "Vérifier la conformité électrique", required: true },
      { text: "Vérifier la conformité gaz", required: true },
      { text: "S'assurer de la décence du logement (surface, équipements)", required: true },
      { text: "Effectuer les travaux nécessaires", required: false },
      { text: "Nettoyer le logement en profondeur", required: false },
    ],
  },
  {
    title: "Fixer le loyer",
    subtitle: "Déterminer le juste prix",
    items: [
      { text: "Étudier les loyers du marché (SeLoger, PAP, LeBonCoin)", required: true },
      { text: "Vérifier si vous êtes en zone tendue", required: true },
      { text: "Vérifier l'encadrement des loyers (Paris, Lyon, Lille...)", required: true },
      { text: "Calculer le rendement locatif souhaité", required: false },
      { text: "Définir le montant des charges récupérables", required: true },
      { text: "Choisir forfait ou provisions sur charges", required: true },
    ],
  },
  {
    title: "Rédiger l'annonce",
    subtitle: "Attirer les bons candidats",
    items: [
      { text: "Prendre des photos de qualité (lumière naturelle)", required: true },
      { text: "Rédiger un descriptif complet et honnête", required: true },
      { text: "Mentionner la surface habitable exacte", required: true },
      { text: "Indiquer le montant du loyer et des charges", required: true },
      { text: "Préciser le dépôt de garantie", required: true },
      { text: "Afficher le DPE (classe énergie et GES)", required: true },
      { text: "Mentionner les équipements (si meublé)", required: false },
      { text: "Diffuser sur plusieurs plateformes", required: false },
    ],
  },
  {
    title: "Sélectionner le locataire",
    subtitle: "Analyser les candidatures",
    items: [
      { text: "Collecter les pièces justificatives autorisées", required: true },
      { text: "Vérifier l'identité du candidat", required: true },
      { text: "Analyser les revenus (ratio loyer/revenus < 33%)", required: true },
      { text: "Vérifier la situation professionnelle", required: true },
      { text: "Évaluer la qualité du garant éventuel", required: false },
      { text: "Vérifier l'éligibilité à la garantie Visale", required: false },
      { text: "Ne pas discriminer (origine, situation familiale...)", required: true },
    ],
  },
  {
    title: "Rédiger le bail",
    subtitle: "Contrat conforme loi ALUR",
    items: [
      { text: "Utiliser le contrat type réglementaire", required: true },
      { text: "Mentionner toutes les informations obligatoires", required: true },
      { text: "Préciser la durée (3 ans vide, 1 an meublé)", required: true },
      { text: "Indiquer le loyer de référence (si encadrement)", required: true },
      { text: "Joindre les diagnostics techniques", required: true },
      { text: "Joindre le règlement de copropriété (extraits)", required: true },
      { text: "Annexer l'inventaire du mobilier (si meublé)", required: false },
      { text: "Faire signer en 2 exemplaires originaux", required: true },
    ],
  },
  {
    title: "État des lieux d'entrée",
    subtitle: "Protéger vos intérêts",
    items: [
      { text: "Utiliser un formulaire conforme décret 2016", required: true },
      { text: "Décrire chaque pièce en détail", required: true },
      { text: "Relever les compteurs (eau, électricité, gaz)", required: true },
      { text: "Prendre des photos datées", required: false },
      { text: "Noter l'état des équipements", required: true },
      { text: "Faire signer par les deux parties", required: true },
      { text: "Remettre un exemplaire au locataire", required: true },
    ],
  },
  {
    title: "Après l'entrée",
    subtitle: "Formalités administratives",
    items: [
      { text: "Déclarer le locataire à l'assurance PNO", required: true },
      { text: "Demander l'attestation d'assurance habitation", required: true },
      { text: "Transmettre les contrats énergie au locataire", required: true },
      { text: "Informer le syndic du changement d'occupant", required: false },
      { text: "Créer le dossier locataire dans votre gestion", required: false },
      { text: "Programmer l'émission des quittances", required: true },
    ],
  },
];

export default function ChecklistMiseEnLocationPage() {
  const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const requiredItems = CHECKLIST_SECTIONS.reduce(
    (sum, s) => sum + s.items.filter((i) => i.required).length,
    0
  );

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
                <ClipboardCheck className="w-3 h-3 mr-1" />
                Checklist pratique
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Checklist{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Mise en Location
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                La liste complète et détaillée de toutes les étapes pour mettre
                votre bien en location. Ne rien oublier, être en conformité.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">{totalItems} points à vérifier</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white">{requiredItems} obligatoires</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-white">5 min de lecture</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger la checklist PDF
                </Button>
              </div>
            </div>
          </motion.div>
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
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                        {sectionIndex + 1}
                      </span>
                      <div>
                        <CardTitle className="text-xl text-white">
                          {section.title}
                        </CardTitle>
                        <p className="text-slate-400 text-sm">{section.subtitle}</p>
                      </div>
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
              Automatisez votre mise en location
            </h2>
            <p className="text-slate-300 mb-6">
              Avec Talok, générez automatiquement vos baux conformes loi ALUR,
              vos états des lieux numériques et suivez chaque étape depuis un tableau de bord.
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
