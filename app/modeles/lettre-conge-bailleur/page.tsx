"use client";

/**
 * Modèle Congé Donné par le Bailleur
 *
 * SEO: Cible "lettre congé bailleur", "préavis propriétaire"
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  Home,
  ShoppingCart,
  Users,
} from "lucide-react";

const MOTIFS_CONGE = [
  {
    motif: "Vente du logement",
    icon: ShoppingCart,
    description: "Le bailleur souhaite vendre le bien libre de toute occupation",
    particularite: "Le locataire bénéficie d'un droit de préemption",
  },
  {
    motif: "Reprise pour habiter",
    icon: Home,
    description: "Le bailleur ou un proche souhaite occuper le logement",
    particularite: "Justifier du lien de parenté et de l'intention réelle",
  },
  {
    motif: "Motif légitime et sérieux",
    icon: Users,
    description: "Manquements graves du locataire à ses obligations",
    particularite: "Doit être justifié par des preuves concrètes",
  },
];

const MENTIONS_OBLIGATOIRES = [
  "Motif du congé (vente, reprise ou motif légitime)",
  "Prix et conditions de vente (si congé pour vente)",
  "Identité du bénéficiaire de la reprise (si reprise)",
  "Lien de parenté avec le bénéficiaire",
  "Rappel du droit de préemption du locataire (si vente)",
  "Date d'effet du congé (fin de bail)",
];

const DELAIS = [
  { type: "Location vide", delai: "6 mois avant fin de bail" },
  { type: "Location meublée", delai: "3 mois avant fin de bail" },
  { type: "Bail mobilité", delai: "Non applicable (pas de renouvellement)" },
];

export default function ModeleLettreCongeBailleurPage() {
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
                  <Mail className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Congé Donné par le{" "}
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Bailleur
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Modèles de lettres pour donner congé à votre locataire : vente,
                reprise personnelle ou motif légitime. Conformes à la loi du 6 juillet 1989.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">6 mois de préavis (vide)</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white">980 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger les modèles
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Motifs de congé */}
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
                Les 3 motifs légaux de congé
              </h2>
              <p className="text-slate-400">
                Le bailleur ne peut donner congé que pour l'un de ces motifs
              </p>
            </motion.div>

            <div className="space-y-6">
              {MOTIFS_CONGE.map((item, index) => (
                <motion.div
                  key={item.motif}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{item.motif}</h3>
                          <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                          <p className="text-sm text-violet-300">
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            {item.particularite}
                          </p>
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

      {/* Délais */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Délais de préavis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DELAIS.map((item) => (
                  <Card key={item.type} className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-slate-400 mb-2">{item.type}</p>
                      <p className="text-xl font-bold text-violet-400">{item.delai}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mentions obligatoires */}
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
                    <CheckCircle2 className="w-5 h-5 text-violet-400" />
                    Mentions obligatoires du congé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MENTIONS_OBLIGATOIRES.map((mention, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        {mention}
                      </li>
                    ))}
                  </ul>
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
                    Mode d'envoi obligatoire
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Le congé doit être notifié par <strong className="text-white">lettre recommandée
                    avec accusé de réception</strong>, par acte d'huissier, ou remis en main propre
                    contre récépissé ou émargement. Un congé envoyé par email ou courrier simple
                    n'a aucune valeur juridique.
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
              Gérez vos fins de bail avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Talok vous rappelle les échéances de vos baux et génère automatiquement
              les courriers de congé avec les mentions obligatoires.
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
