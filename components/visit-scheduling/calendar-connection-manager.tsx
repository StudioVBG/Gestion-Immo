"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Link2,
  Unlink,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CalendarConnection {
  id: string;
  provider: "google" | "outlook";
  calendar_id: string;
  calendar_name: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  created_at: string;
}

interface CalendarConnectionManagerProps {
  className?: string;
}

const PROVIDERS = {
  google: {
    name: "Google Calendar",
    icon: "/icons/google-calendar.svg",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    buttonColor: "bg-white hover:bg-gray-50 border border-gray-300",
  },
  outlook: {
    name: "Outlook Calendar",
    icon: "/icons/outlook.svg",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    buttonColor: "bg-[#0078d4] hover:bg-[#106ebe] text-white",
  },
};

async function fetchConnections(): Promise<CalendarConnection[]> {
  const res = await fetch("/api/visit-scheduling/calendar-connections");
  if (!res.ok) throw new Error("Erreur lors du chargement");
  const data = await res.json();
  return data.connections || [];
}

async function initiateGoogleOAuth(): Promise<string> {
  const res = await fetch("/api/visit-scheduling/calendar-connections/oauth/google");
  if (!res.ok) throw new Error("Erreur OAuth");
  const data = await res.json();
  return data.authUrl;
}

async function disconnectCalendar(id: string): Promise<void> {
  const res = await fetch(`/api/visit-scheduling/calendar-connections?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erreur lors de la déconnexion");
}

export function CalendarConnectionManager({ className }: CalendarConnectionManagerProps) {
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading, error } = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: fetchConnections,
  });

  const connectGoogleMutation = useMutation({
    mutationFn: initiateGoogleOAuth,
    onSuccess: (authUrl) => {
      window.location.href = authUrl;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      setDisconnectId(null);
    },
  });

  const googleConnection = connections.find((c) => c.provider === "google");
  const outlookConnection = connections.find((c) => c.provider === "outlook");

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Connexions Calendrier
        </CardTitle>
        <CardDescription>
          Synchronisez vos disponibilités avec votre calendrier personnel
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des connexions
            </AlertDescription>
          </Alert>
        )}

        {/* Google Calendar */}
        <div
          className={cn(
            "rounded-lg border p-4 transition-colors",
            googleConnection
              ? PROVIDERS.google.color
              : "bg-muted/30"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Google Calendar</p>
                {googleConnection ? (
                  <p className="text-sm text-muted-foreground">
                    {googleConnection.calendar_name}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Non connecté
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {googleConnection ? (
                <>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connecté
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisconnectId(googleConnection.id)}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectGoogleMutation.mutate()}
                  disabled={connectGoogleMutation.isPending}
                >
                  {connectGoogleMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Connecter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Outlook Calendar (Coming Soon) */}
        <div className="rounded-lg border p-4 bg-muted/30 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    fill="#0078D4"
                    d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.154-.354.23-.583.23h-8.462v-6.884h2.012l.3-2.339h-2.313V7.878c0-.678.188-1.14 1.16-1.14h1.24V4.561a16.587 16.587 0 0 0-1.808-.092c-1.788 0-3.012 1.092-3.012 3.095v1.725H9.992v2.339h2.304v6.884H.82a.795.795 0 0 1-.582-.23.772.772 0 0 1-.238-.576V7.387c0-.23.08-.424.238-.576a.795.795 0 0 1 .583-.23H23.18c.229 0 .423.077.583.23.159.152.238.346.238.576z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Outlook Calendar</p>
                <p className="text-sm text-muted-foreground">
                  Bientôt disponible
                </p>
              </div>
            </div>
            <Badge variant="secondary">À venir</Badge>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          <p>
            La synchronisation permet d'ajouter automatiquement vos visites
            confirmées à votre calendrier personnel et de bloquer les créneaux
            déjà occupés.
          </p>
        </div>
      </CardContent>

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectId} onOpenChange={() => setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter le calendrier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les visites existantes ne seront pas supprimées de votre calendrier,
              mais les nouvelles visites ne seront plus synchronisées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectId && disconnectMutation.mutate(disconnectId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
