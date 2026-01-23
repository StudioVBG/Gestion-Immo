"use client";

/**
 * Modèle Attestation d'Hébergement
 *
 * SEO: Cible "attestation hébergement gratuite", "certificat hébergement"
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
  AlertTriangle,
  Sparkles,
  FileText,
  Home,
} from "lucide-react";

const MENTIONS_OBLIGATOIRES = [
  "Identité de l'hébergeant (nom, prénom, date et lieu de naissance)",
  "Adresse complète du logement",
  "Identité de la personne hébergée",
  "Lien avec la personne hébergée (famille, ami...)",
  "Date de début de l'hébergement",
  "Mention \"sur l'honneur\"",
  "Date et signature de l'hébergeant",
];

const PIECES_JOINTES = [
  "Copie de la pièce d'identité de l'hébergeant",
  "Justificatif de domicile de moins de 3 mois de l'hébergeant",
];

const CAS_UTILISATION = [
  "Ouverture d'un compte bancaire",
  "Inscription sur les listes électorales",
  "Obtention de la carte grise",
  "Demande de carte d'identité ou passeport",
  "Inscription à Pôle Emploi",
  "Demande d'aides sociales (CAF, etc.)",
  "Inscription scolaire ou universitaire",
  "Souscription d'un abonnement (téléphone, internet...)",
];

export default function ModeleAttestationHebergementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent" />

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
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                  <Users className="w-3 h-3 mr-1" />
                  Document gratuit
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Attestation{" "}
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  d'Hébergement
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-2xl">
                Modèle pour héberger un tiers (famille, ami). Document officiel
                avec toutes les mentions légales requises.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-white">PDF & Word</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-4 py-2">
                  <Download className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-white">2 100 téléchargements/mois</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger en PDF
                </Button>
                <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger en Word
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Aperçu */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Exemple document */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white text-slate-900 p-6 shadow-2xl">
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold">ATTESTATION D'HÉBERGEMENT</h2>
                  </div>

                  <div className="space-y-4 text-sm">
                    <p>Je soussigné(e),</p>
                    <p className="text-slate-600">[Nom, Prénom de l'hébergeant]</p>
                    <p className="text-slate-600">Né(e) le [date] à [lieu]</p>
                    <p className="text-slate-600">Demeurant : [adresse complète]</p>

                    <p className="pt-4">
                      Atteste sur l'honneur héberger à mon domicile :
                    </p>
                    <p className="text-slate-600">[Nom, Prénom de l'hébergé]</p>
                    <p className="text-slate-600">Né(e) le [date] à [lieu]</p>

                    <p className="pt-4">
                      Cette personne réside à titre gratuit à mon domicile depuis le [date].
                    </p>

                    <p className="pt-4 text-xs text-slate-500">
                      Fait pour servir et valoir ce que de droit.
                    </p>

                    <div className="pt-4 text-xs text-slate-500">
                      <p>Fait à [Ville], le [Date]</p>
                      <p className="mt-4">Signature de l'hébergeant</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Mentions obligatoires */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-slate-800/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-400" />
                      Mentions obligatoires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {MENTIONS_OBLIGATOIRES.map((mention, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                          {mention}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 pt-4 border-t border-slate-700">
                      <h4 className="text-white font-medium mb-2">Pièces à joindre :</h4>
                      <ul className="space-y-2">
                        {PIECES_JOINTES.map((piece, i) => (
                          <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                            <FileText className="w-4 h-4 text-teal-400" />
                            {piece}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Cas d'utilisation */}
      <section className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Quand utiliser ce document ?
              </h2>
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CAS_UTILISATION.map((cas, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <Home className="w-4 h-4 text-teal-400 flex-shrink-0" />
                        {cas}
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
                    Attention : fausse attestation
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Établir une fausse attestation d'hébergement est un délit passible de
                    <strong className="text-white"> 1 an d'emprisonnement et 15 000 € d'amende</strong> (article 441-7 du Code pénal).
                    Ce document engage votre responsabilité. Ne l'établissez que si vous
                    hébergez réellement la personne concernée.
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
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-teal-900/50 to-emerald-900/50 rounded-3xl p-12 border border-teal-500/30"
          >
            <Sparkles className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Gérez tous vos documents locatifs
            </h2>
            <p className="text-slate-300 mb-6">
              Talok centralise tous vos documents : baux, quittances, attestations.
              Générez-les en un clic et retrouvez-les facilement.
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
