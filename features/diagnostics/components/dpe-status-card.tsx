"use client";

import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  RefreshCw,
  Plus
} from "lucide-react";
import { dpeService } from "../services/dpe.service";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DpeStatusCardProps {
  propertyId: string;
  onAction?: () => void;
}

export function DpeStatusCard({ propertyId, onAction }: DpeStatusCardProps) {
  const [loading, setLoading] = useState(true);
  const [dpeInfo, setDpeInfo] = useState<any>(null);

  useEffect(() => {
    fetchDpeStatus();
  }, [propertyId]);

  async function fetchDpeStatus() {
    try {
      setLoading(true);
      const result = await dpeService.getLatestDeliverable(propertyId);
      setDpeInfo(result);
    } catch (error) {
      console.error("Erreur chargement DPE:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-slate-100 rounded-xl" />
      </Card>
    );
  }

  // Gérer le cas où dpeInfo est null (erreur de chargement ou table non existante)
  const status = dpeInfo?.status || "MISSING";
  const data = dpeInfo?.data || null;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Diagnostic Énergie (DPE)</CardTitle>
              <CardDescription>Conformité et performance</CardDescription>
            </div>
          </div>
          
          <Badge 
            variant={status === "VALID" ? "default" : "destructive"}
            className={status === "VALID" ? "bg-emerald-500" : ""}
          >
            {status === "VALID" ? "Valide" : status === "EXPIRED" ? "Expiré" : "Manquant"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Classe Énergie</span>
                <div className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded flex items-center justify-center text-white font-bold
                    ${data.energy_class === 'A' ? 'bg-emerald-600' : 
                      data.energy_class === 'B' ? 'bg-emerald-500' : 
                      data.energy_class === 'C' ? 'bg-lime-500' : 
                      data.energy_class === 'D' ? 'bg-yellow-400' : 
                      data.energy_class === 'E' ? 'bg-orange-400' : 
                      data.energy_class === 'F' ? 'bg-orange-600' : 'bg-red-600'}
                  `}>
                    {data.energy_class}
                  </div>
                  <span className="text-sm font-medium">Logement {data.energy_class}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Émissions GES</span>
                <div className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded flex items-center justify-center text-white font-bold
                    ${data.ges_class === 'A' ? 'bg-indigo-300' : 
                      data.ges_class === 'B' ? 'bg-indigo-400' : 
                      data.ges_class === 'C' ? 'bg-indigo-500' : 
                      data.ges_class === 'D' ? 'bg-indigo-600' : 
                      data.ges_class === 'E' ? 'bg-indigo-700' : 
                      data.ges_class === 'F' ? 'bg-indigo-800' : 'bg-indigo-950'}
                  `}>
                    {data.ges_class || '?'}
                  </div>
                  <span className="text-sm font-medium">Classe {data.ges_class || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Numéro ADEME :</span>
                <span className="font-mono font-medium">{data.dpe_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Établi le :</span>
                <span>{format(new Date(data.issued_at), "dd MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valable jusqu&apos;au :</span>
                <span className={status === "EXPIRED" ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                  {format(new Date(data.valid_until), "dd MMMM yyyy", { locale: fr })}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`/api/documents/view?path=${encodeURIComponent(data.pdf_path)}`} target="_blank">
                  <Download className="mr-2 h-4 w-4" />
                  Voir le PDF
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/properties/${propertyId}/diagnostics/dpe/request`}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renouveler
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="p-3 rounded-full bg-amber-50">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">DPE Manquant ou Expiré</p>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Le DPE est obligatoire pour toute mise en location et doit être valide.
              </p>
            </div>
            
            <div className="flex flex-col w-full gap-2 pt-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                <Link href={`/properties/${propertyId}/diagnostics/dpe/request`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Demander un DPE
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/properties/${propertyId}/diagnostics/dpe/upload`}>
                  <Download className="mr-2 h-4 w-4" />
                  Importer mon DPE
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

