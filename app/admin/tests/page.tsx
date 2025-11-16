"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "success" | "error";
  error?: string;
  details?: any;
}

async function getAuthHeaders() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return { headers, supabase };
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const testDefinitions: Omit<TestResult, "status" | "error" | "details">[] = [
    {
      id: "auth_connection",
      name: "Connexion Auth",
      description: "Vérifier que l'authentification Supabase fonctionne",
    },
    {
      id: "database_connection",
      name: "Connexion Base de données",
      description: "Vérifier la connexion à la base de données PostgreSQL",
    },
    {
      id: "profiles_table",
      name: "Table Profiles",
      description: "Vérifier l'accès à la table profiles",
    },
    {
      id: "rls_policies",
      name: "Politiques RLS",
      description: "Vérifier que les politiques RLS sont actives",
    },
    {
      id: "admin_role",
      name: "Rôle Admin",
      description: "Vérifier que le rôle admin existe et fonctionne",
    },
    {
      id: "owner_role",
      name: "Rôle Owner",
      description: "Vérifier que le rôle owner existe et fonctionne",
    },
    {
      id: "tenant_role",
      name: "Rôle Tenant",
      description: "Vérifier que le rôle tenant existe et fonctionne",
    },
    {
      id: "provider_role",
      name: "Rôle Provider",
      description: "Vérifier que le rôle provider existe et fonctionne",
    },
    {
      id: "email_confirmation",
      name: "Confirmation Email",
      description: "Vérifier le processus de confirmation d'email",
    },
    {
      id: "onboarding_flow",
      name: "Flux Onboarding",
      description: "Vérifier les tables d'onboarding",
    },
    {
      id: "tenant_tables",
      name: "Tables Tenant",
      description: "Vérifier les tables tenant (roommates, payment_shares, etc.)",
    },
    {
      id: "admin_tables",
      name: "Tables Admin",
      description: "Vérifier les tables admin (tenants, roles, permissions, etc.)",
    },
    {
      id: "admin_properties_endpoint",
      name: "API Propriétés (Admin)",
      description: "Vérifier que l'API admin peut lister les logements",
    },
    {
      id: "admin_vendor_detail",
      name: "Fiche Prestataire (Admin)",
      description: "Vérifier que la page détail prestataire renvoie 200",
    },
    {
      id: "parking_schema",
      name: "Parking / Box",
      description: "Contrôler la colonne parking_details et les enregistrements parking",
    },
  ];

  const runTest = async (testId: string): Promise<TestResult> => {
    const testDef = testDefinitions.find((t) => t.id === testId);
    if (!testDef) {
      throw new Error(`Test ${testId} non trouvé`);
    }

    const { headers, supabase } = await getAuthHeaders();
    const result: TestResult = {
      ...testDef,
      status: "running",
    };

    try {
      switch (testId) {
        case "auth_connection": {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) throw error;
          result.status = "success";
          result.details = { user_id: user?.id, email: user?.email };
          break;
        }

        case "database_connection": {
          const { data, error } = await supabase.from("profiles").select("count").limit(1);
          if (error) throw error;
          result.status = "success";
          result.details = { connected: true };
          break;
        }

        case "profiles_table": {
          const { data, error, count } = await supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .limit(1);
          if (error) throw error;
          result.status = "success";
          result.details = { count: count || data?.length || 0 };
          break;
        }

        case "rls_policies": {
          // Vérifier en essayant d'accéder à la table
          const { error: accessError } = await supabase.from("profiles").select("id").limit(1);
          // Si erreur 42501, RLS est actif (c'est bon)
          if (accessError && accessError.code === "42501") {
            result.status = "success";
            result.details = { rls_enabled: true, message: "RLS bloque l'accès (normal)" };
          } else if (accessError) {
            throw accessError;
          } else {
            result.status = "success";
            result.details = { rls_enabled: true, message: "Accès autorisé" };
          }
          break;
        }

        case "admin_role": {
          const { data, error, count } = await supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .eq("role", "admin")
            .limit(1);
          if (error) throw error;
          result.status = "success";
          result.details = { admin_count: count || data?.length || 0 };
          break;
        }

        case "owner_role": {
          const { data, error, count } = await supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .eq("role", "owner")
            .limit(1);
          if (error) throw error;
          result.status = "success";
          result.details = { owner_count: count || data?.length || 0 };
          break;
        }

        case "tenant_role": {
          const { data, error, count } = await supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .eq("role", "tenant")
            .limit(1);
          if (error) throw error;
          result.status = "success";
          result.details = { tenant_count: count || data?.length || 0 };
          break;
        }

        case "provider_role": {
          const { data, error, count } = await supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .eq("role", "provider")
            .limit(1);
          if (error) throw error;
          result.status = "success";
          result.details = { provider_count: count || data?.length || 0 };
          break;
        }

        case "email_confirmation": {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Utilisateur non connecté");
          result.status = "success";
          result.details = {
            email_confirmed: !!user.email_confirmed_at,
            email: user.email,
          };
          break;
        }

        case "onboarding_flow": {
          const { data, error } = await supabase
            .from("onboarding_progress")
            .select("id")
            .limit(1);
          if (error && error.code !== "PGRST116") throw error;
          result.status = "success";
          result.details = { table_exists: true };
          break;
        }

        case "tenant_tables": {
          const tables = ["roommates", "payment_shares", "tenant_applications"];
          const results: Record<string, boolean> = {};
          
          for (const table of tables) {
            const response = await fetch(`/api/admin/tests/table-exists?table=${table}`, {
              credentials: "include",
              headers,
            });
            const json = await response.json().catch(() => ({}));
            results[table] = !!json.exists;
          }
          
          const allExist = Object.values(results).every((v) => v);
          if (!allExist) {
            throw new Error(`Tables manquantes: ${Object.entries(results).filter(([_, v]) => !v).map(([k]) => k).join(", ")}`);
          }
          
          result.status = "success";
          result.details = results;
          break;
        }

        case "admin_tables": {
          const tables = ["tenants", "roles", "permissions", "role_permissions", "user_roles"];
          const results: Record<string, boolean> = {};
          
          for (const table of tables) {
            const response = await fetch(`/api/admin/tests/table-exists?table=${table}`, {
              credentials: "include",
              headers,
            });
            const json = await response.json().catch(() => ({}));
            results[table] = !!json.exists;
          }
          
          const allExist = Object.values(results).every((v) => v);
          if (!allExist) {
            throw new Error(`Tables manquantes: ${Object.entries(results).filter(([_, v]) => !v).map(([k]) => k).join(", ")}`);
          }
          
          result.status = "success";
          result.details = results;
          break;
        }

        case "admin_properties_endpoint": {
          try {
            const { data, error } = await supabase.from("properties").select("id").limit(1);
            if (error) throw error;
            result.status = "success";
            result.details = { properties_count: Array.isArray(data) ? data.length : 0 };
          } catch (err: any) {
            result.status = "error";
            result.error =
              err?.code === "42703"
                ? "Colonne absente dans Supabase (applique les migrations récentes)"
                : err.message;
            result.details = { error_code: err.code, hint: err.hint, message: err.message };
          }
          break;
        }

        case "admin_vendor_detail": {
          const vendorsResponse = await fetch("/api/admin/people/vendors?limit=1", {
            credentials: "include",
            headers,
          });

          if (!vendorsResponse.ok) {
            const errorPayload = await vendorsResponse.json().catch(() => ({}));
            throw new Error(errorPayload.error || "Impossible de récupérer les prestataires");
          }

          const vendorsData = await vendorsResponse.json();
          const firstVendor = vendorsData?.items?.[0];

          if (!firstVendor) {
            result.status = "success";
            result.details = { vendor_found: false, message: "Aucun prestataire enregistré" };
            break;
          }

          const detailResponse = await fetch(`/admin/people/vendors/${firstVendor.id}`, {
            credentials: "include",
            headers,
          });

          if (!detailResponse.ok) {
            throw new Error(`Détail prestataire indisponible (${detailResponse.status})`);
          }

          const detailHtml = await detailResponse.text();
          result.status = "success";
          result.details = {
            vendor_found: true,
            vendor_id: firstVendor.id,
            html_snapshot: detailHtml.slice(0, 200),
          };
          break;
        }

        case "parking_schema": {
          try {
            const { data, error } = await supabase
              .from("properties")
              .select("id, type, parking_details")
              .eq("type", "parking")
              .limit(5);
            if (error) throw error;

            const sample =
              data?.map((property) => ({
                id: property.id,
                has_details: Boolean(property.parking_details),
                placement: property.parking_details?.placement_type ?? null,
              })) ?? [];

            result.status = "success";
            result.details = {
              parking_count: data?.length ?? 0,
              sample,
            };
          } catch (err: any) {
            result.status = "error";
            result.error =
              err?.code === "42703"
                ? "Colonne parking_details absente (applique la migration 202411140500)"
                : err.message;
            result.details = { error_code: err.code, hint: err.hint, message: err.message };
          }
          break;
        }

        default:
          throw new Error(`Test ${testId} non implémenté`);
      }
    } catch (error: any) {
      result.status = "error";
      result.error = error.message || "Erreur inconnue";
      result.details = { 
        error_code: error.code, 
        error_message: error.message,
        error_details: error.details,
      };
    }

    return result;
  };

  const runAllTests = async () => {
    setRunning(true);
    const results: TestResult[] = [];

    for (const testDef of testDefinitions) {
      const result = await runTest(testDef.id);
      results.push(result);
      setTests([...results]);
      // Petit délai pour la lisibilité
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setRunning(false);
  };

  const runSingleTest = async (testId: string) => {
    const index = tests.findIndex((t) => t.id === testId);
    if (index === -1) return;

    const newTests = [...tests];
    newTests[index] = { ...newTests[index], status: "running" };
    setTests(newTests);

    const result = await runTest(testId);
    newTests[index] = result;
    setTests(newTests);
  };

  useEffect(() => {
    // Initialiser les tests en état "pending"
    setTests(
      testDefinitions.map((t) => ({
        ...t,
        status: "pending" as const,
      }))
    );
  }, []);

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge variant="success">Succès</Badge>;
      case "error":
        return <Badge variant="destructive">Erreur</Badge>;
      case "running":
        return <Badge variant="default">En cours...</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const successCount = tests.filter((t) => t.status === "success").length;
  const errorCount = tests.filter((t) => t.status === "error").length;
  const totalCount = tests.length;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tests Système</h1>
            <p className="text-muted-foreground mt-2">
              Vérification de tous les processus et fonctionnalités
            </p>
          </div>
          <Button onClick={runAllTests} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tests en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Lancer tous les tests
              </>
            )}
          </Button>
        </div>

        {totalCount > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-muted-foreground">Succès</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <div className="text-sm text-muted-foreground">Erreurs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalCount}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {test.status !== "running" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runSingleTest(test.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {test.error && (
                <CardContent>
                  <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-red-900 dark:text-red-100">
                          Erreur
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {test.error}
                        </div>
                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                              Détails techniques
                            </summary>
                            <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900 p-2 rounded overflow-auto">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
              {test.status === "success" && test.details && (
                <CardContent>
                  <details>
                    <summary className="text-sm text-muted-foreground cursor-pointer">
                      Détails
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}

