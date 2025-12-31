// @ts-nocheck
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  Calendar,
  Home,
  FileSignature,
  Eye,
  ChevronRight,
} from "lucide-react";
import { formatDateShort } from "@/lib/helpers/format";
import Link from "next/link";

export default async function TenantInspectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  // Récupérer le profil du locataire
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "tenant") {
    redirect("/dashboard");
  }

  // Récupérer les EDL où le locataire est signataire
  const { data: edlSignatures } = await supabase
    .from("edl_signatures")
    .select(
      `
      *,
      edl:edl_id(
        *,
        lease:lease_id(
          *,
          property:properties(*)
        ),
        property_details:property_id(*)
      )
    `
    )
    .eq("signer_profile_id", profile.id);

  // Filtrer les EDL valides
  const edlList =
    edlSignatures
      ?.filter((sig: any) => sig.edl)
      .map((sig: any) => ({
        id: sig.edl.id,
        type: sig.edl.type,
        status: sig.edl.status,
        scheduled_at: sig.edl.scheduled_at,
        completed_at: sig.edl.completed_at,
        created_at: sig.edl.created_at,
        property:
          sig.edl.lease?.property || sig.edl.property_details,
        mySignature: {
          signed_at: sig.signed_at,
          signature_image_path: sig.signature_image_path,
        },
        needsMySignature: !sig.signed_at && sig.edl.status !== "draft",
      })) || [];

  // Trier : ceux qui nécessitent une signature en premier
  edlList.sort((a: any, b: any) => {
    if (a.needsMySignature && !b.needsMySignature) return -1;
    if (!a.needsMySignature && b.needsMySignature) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pendingSignatures = edlList.filter((e: any) => e.needsMySignature);

  const getStatusBadge = (status: string, needsSign: boolean) => {
    if (needsSign) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          ✍️ À signer
        </Badge>
      );
    }
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Brouillon</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Programmé</Badge>;
      case "in_progress":
        return <Badge className="bg-indigo-100 text-indigo-800">En cours</Badge>;
      case "completed":
        return <Badge className="bg-purple-100 text-purple-800">Terminé</Badge>;
      case "signed":
        return <Badge className="bg-green-100 text-green-800">✅ Signé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "entree" ? "État des lieux d'entrée" : "État des lieux de sortie";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">États des lieux</h1>
        <p className="text-muted-foreground">
          Consultez et signez vos états des lieux.
        </p>
      </div>

      {/* Alerte si des signatures sont en attente */}
      {pendingSignatures.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <FileSignature className="h-5 w-5" />
              Action requise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700">
              {pendingSignatures.length === 1
                ? "Un état des lieux nécessite votre signature."
                : `${pendingSignatures.length} états des lieux nécessitent votre signature.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste des EDL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Mes états des lieux
          </CardTitle>
          <CardDescription>
            Historique de tous vos états des lieux
          </CardDescription>
        </CardHeader>
        <CardContent>
          {edlList.length > 0 ? (
            <div className="divide-y">
              {edlList.map((edl: any) => (
                <div
                  key={edl.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Home className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium">{getTypeLabel(edl.type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {edl.property?.adresse || "Adresse non définie"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {edl.scheduled_at
                          ? formatDateShort(edl.scheduled_at)
                          : edl.created_at
                          ? formatDateShort(edl.created_at)
                          : "Date non définie"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(edl.status, edl.needsMySignature)}
                    <Link href={`/app/tenant/inspections/${edl.id}`}>
                      <Button
                        variant={edl.needsMySignature ? "default" : "outline"}
                        size="sm"
                      >
                        {edl.needsMySignature ? (
                          <>
                            Signer <ChevronRight className="h-4 w-4 ml-1" />
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" /> Voir
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Aucun état des lieux trouvé.</p>
              <p className="text-sm mt-1">
                Ils apparaîtront ici lorsque votre bailleur les créera.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


