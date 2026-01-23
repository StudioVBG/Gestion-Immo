"use client";

/**
 * Modèle Lettre de Relance Impayé
 *
 * SEO: Cible "lettre relance loyer impayé", "mise en demeure locataire"
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
  Euro,
} from "lucide-react";

const MODELES_INCLUS = [
  {
    title: "Relance amiable",
    timing: "J+5 après échéance",
    description: "Premier rappel cordial de l'obligation de paiement",
    tone: "Amical",
  },
  {
    title: "Relance ferme",
    timing: "J+15 sans réponse",
    description: "Rappel des obligations contractuelles et légales",
    tone: "Formel",
  },
  {
    title: "Mise en demeure",
    timing: "J+30 sans paiement",
    description: "Dernière étape avant action judiciaire",
    tone: "Juridique",
  },
];

const ETAPES_RECOUVREMENT = [
  { step: 1, action: "Relance téléphonique", delai: "Dès J+1", obligatoire: false },
  { step: 2, action: "Relance amiable écrite", delai: "J+5", obligatoire: false },
  { step: 3, action: "Relance RAR", delai: "J+15", obligatoire: true },
  { step: 4, action: "Mise en demeure RAR", delai: "J+30", obligatoire: true },
  { step: 5, action: "Commandement de payer (huissier)", delai: "J+45", obligatoire: true },
  { step: 6, action: "Assignation au tribunal", delai: "J+60+", obligatoire: true },
];

export default function ModeleRelanceImpayePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  <Euro className="w-3 h-3 mr-1" />
                  Documents gratuits
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Lettres de{" "}
                <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                  Relance Impayé
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                3 modèles de courriers : relance amiable, relance ferme et mise en
                demeure. Protégez vos droits tout en préservant la relation locataire.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Mail className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-white">3 modèles inclus</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-white">1 200 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-red-600 hover:bg-red-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger les 3 modèles
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 Modèles */}
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
                3 niveaux de relance
              </h2>
              <p className="text-slate-400">
                Adaptez votre communication selon l'évolution de la situation
              </p>
            </motion.div>

            <div className="space-y-6">
              {MODELES_INCLUS.map((modele, index) => (
                <motion.div
                  key={modele.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{modele.title}</h3>
                          <p className="text-sm text-slate-400">{modele.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-slate-700/50 text-slate-300">
                            <Clock className="w-3 h-3 mr-1" />
                            {modele.timing}
                          </Badge>
                          <Badge className={
                            modele.tone === "Amical"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : modele.tone === "Formel"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-red-500/20 text-red-300 border-red-500/30"
                          }>
                            {modele.tone}
                          </Badge>
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

      {/* Procédure de recouvrement */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Procédure de recouvrement
              </h2>
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {ETAPES_RECOUVREMENT.map((etape, i) => (
                      <div
                        key={etape.step}
                        className="flex items-center gap-4 pb-4 border-b border-slate-700/50 last:border-0"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
                          {etape.step}
                        </div>
                        <div className="flex-1">
                          <span className="text-white">{etape.action}</span>
                        </div>
                        <Badge className="bg-slate-700/50 text-slate-300">
                          {etape.delai}
                        </Badge>
                        {etape.obligatoire && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Conseils */}
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
                    Conseils pour gérer les impayés
                  </h3>
                  <ul className="text-slate-300 text-sm space-y-2">
                    <li>• Réagissez vite : plus vous attendez, plus le recouvrement est difficile</li>
                    <li>• Gardez une trace écrite de toutes vos démarches (courriers, emails)</li>
                    <li>• Privilégiez d'abord le dialogue : la plupart des impayés se résolvent à l'amiable</li>
                    <li>• Les lettres recommandées avec AR sont indispensables pour toute procédure</li>
                    <li>• Contactez votre assurance GLI si vous en avez une</li>
                  </ul>
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-red-900/50 to-rose-900/50 rounded-3xl p-12 border border-red-500/30"
          >
            <Sparkles className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Relances automatiques avec Talok
            </h2>
            <p className="text-slate-300 mb-6">
              Talok détecte automatiquement les retards de paiement et envoie les
              relances selon le calendrier que vous définissez.
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
