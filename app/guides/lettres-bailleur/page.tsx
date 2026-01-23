"use client";

/**
 * 15 Modèles de Lettres du Bailleur
 *
 * SEO: Cible "lettre type bailleur", "courrier propriétaire"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Download,
  Mail,
  Clock,
  AlertTriangle,
  Euro,
  Home,
  UserX,
  Wrench,
  Calendar,
} from "lucide-react";

const LETTRES = [
  {
    category: "Relances et impayés",
    icon: Euro,
    color: "amber",
    items: [
      {
        title: "Relance amiable premier impayé",
        description: "À envoyer dès le 5 du mois suivant l'échéance",
        timing: "J+5 après échéance",
      },
      {
        title: "Relance recommandée",
        description: "Rappel ferme des obligations du locataire",
        timing: "J+15 après première relance",
      },
      {
        title: "Mise en demeure de payer",
        description: "Dernière étape avant procédure judiciaire",
        timing: "J+30 après échéance",
      },
    ],
  },
  {
    category: "Congés et préavis",
    icon: Calendar,
    color: "violet",
    items: [
      {
        title: "Congé pour vente",
        description: "Notification au locataire avec offre de vente prioritaire",
        timing: "6 mois avant fin de bail",
      },
      {
        title: "Congé pour reprise personnelle",
        description: "Reprise pour habiter ou loger un proche",
        timing: "6 mois avant fin de bail",
      },
      {
        title: "Congé pour motif légitime et sérieux",
        description: "Manquements graves du locataire",
        timing: "6 mois avant fin de bail",
      },
      {
        title: "Accusé réception congé locataire",
        description: "Confirmer la réception et le délai applicable",
        timing: "Sous 8 jours",
      },
    ],
  },
  {
    category: "Gestion courante",
    icon: Home,
    color: "emerald",
    items: [
      {
        title: "Révision annuelle du loyer (IRL)",
        description: "Notification de la nouvelle valeur du loyer",
        timing: "Date anniversaire du bail",
      },
      {
        title: "Régularisation des charges",
        description: "Décompte annuel avec justificatifs",
        timing: "Annuelle",
      },
      {
        title: "Demande d'attestation d'assurance",
        description: "Rappel de l'obligation d'assurance habitation",
        timing: "Annuelle ou à l'entrée",
      },
      {
        title: "Notification travaux",
        description: "Information sur des travaux à réaliser dans le logement",
        timing: "Avant travaux",
      },
    ],
  },
  {
    category: "Fin de bail",
    icon: UserX,
    color: "red",
    items: [
      {
        title: "Convocation état des lieux de sortie",
        description: "Fixer date et heure de l'EDL",
        timing: "15 jours avant sortie",
      },
      {
        title: "Notification retenues sur dépôt",
        description: "Justification des retenues avec factures",
        timing: "À la restitution",
      },
      {
        title: "Restitution du dépôt de garantie",
        description: "Courrier accompagnant le chèque de restitution",
        timing: "1 ou 2 mois max",
      },
      {
        title: "Réclamation dégradations",
        description: "Demande de remboursement pour dégâts",
        timing: "Après EDL sortie",
      },
    ],
  },
];

export default function GuideLettresBailleurPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

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
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-4">
                <Mail className="w-3 h-3 mr-1" />
                Modèles de courriers
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                15 Modèles de{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Lettres du Bailleur
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Relances, congés, régularisation, augmentation... Tous les modèles
                de courriers dont vous avez besoin pour gérer vos relations avec vos locataires.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">15 modèles</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Word & PDF</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Mis à jour 2026</span>
                </div>
              </div>

              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Télécharger tous les modèles
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lettres par catégorie */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            {LETTRES.map((category, catIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-${category.color}-500/20 flex items-center justify-center`}>
                    <category.icon className={`w-5 h-5 text-${category.color}-400`} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{category.category}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((lettre, index) => (
                    <Card
                      key={lettre.title}
                      className="bg-slate-800/30 border-slate-700/50 hover:border-blue-500/50 transition-colors cursor-pointer group"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-white group-hover:text-blue-300 transition-colors">
                          {lettre.title}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          {lettre.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-slate-700/50 text-slate-300 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {lettre.timing}
                          </Badge>
                          <span className="text-blue-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            <Download className="w-4 h-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Conseils d'envoi */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-8 text-center">
                Conseils pour vos courriers
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-400" />
                      Lettre recommandée AR
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 text-sm space-y-2">
                    <p>Obligatoire pour :</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Congé du bailleur</li>
                      <li>Mise en demeure</li>
                      <li>Notification travaux importants</li>
                      <li>Tout courrier à valeur juridique</li>
                    </ul>
                    <p className="text-amber-400 text-xs mt-4">
                      Conservez l'AR pendant toute la durée du bail + 3 ans
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      Points d'attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 text-sm space-y-2">
                    <ul className="space-y-2 text-slate-400">
                      <li>• Respectez les délais légaux (6 mois pour congé)</li>
                      <li>• Mentionnez toujours les références du bail</li>
                      <li>• Gardez une copie de tous vos courriers</li>
                      <li>• En cas de doute, consultez un professionnel</li>
                    </ul>
                  </CardContent>
                </Card>
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-3xl p-12 border border-blue-500/30"
          >
            <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Automatisez vos relances avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Plus besoin de rédiger vos courriers manuellement. Talok génère
              automatiquement les relances, révisions de loyer et régularisations.
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
