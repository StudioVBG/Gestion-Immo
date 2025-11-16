"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { peopleService, type OwnerRow, type TenantRow, type VendorRow } from "@/features/admin/services/people.service";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { Search, Eye, Building2, Users, Wrench } from "lucide-react";
import Link from "next/link";

function PeopleDirectoryContent() {
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"owners" | "tenants" | "vendors">("owners");
  const [search, setSearch] = useState("");
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [totalOwners, setTotalOwners] = useState(0);
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalVendors, setTotalVendors] = useState(0);
  const [loadingByTab, setLoadingByTab] = useState({
    owners: true,
    tenants: true,
    vendors: true,
  });
  const [pages, setPages] = useState({
    owners: 1,
    tenants: 1,
    vendors: 1,
  });
  const limit = 20;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: "Non authentifié",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive",
      });
      return;
    }

    if (profile?.role !== "admin") {
      toast({
        title: "Accès refusé",
        description: "Vous devez être administrateur pour accéder à cette page.",
        variant: "destructive",
      });
      return;
    }

    void preloadAllTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (!user || profile?.role !== "admin") return;
    void fetchTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, pages[activeTab]]);

  const preloadAllTabs = async () => {
    try {
      setLoadingByTab({ owners: true, tenants: true, vendors: true });
      const [ownersRes, tenantsRes, vendorsRes] = await Promise.all([
        peopleService.getOwners({ search: "", page: 1, limit }),
        peopleService.getTenants({ search: "", page: 1, limit, status: "active" }),
        peopleService.getVendors({ search: "", page: 1, limit }),
      ]);
      setOwners(ownersRes.items);
      setTotalOwners(ownersRes.total);
      setTenants(tenantsRes.items);
      setTotalTenants(tenantsRes.total);
      setVendors(vendorsRes.items);
      setTotalVendors(vendorsRes.total);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger l'annuaire.",
        variant: "destructive",
      });
    } finally {
      setLoadingByTab({ owners: false, tenants: false, vendors: false });
    }
  };

  const fetchTab = async (tab: "owners" | "tenants" | "vendors") => {
    setLoadingByTab((prev) => ({ ...prev, [tab]: true }));
    try {
      if (tab === "owners") {
        const res = await peopleService.getOwners({
          search,
          page: pages.owners,
          limit,
        });
        setOwners(res.items);
        setTotalOwners(res.total);
      } else if (tab === "tenants") {
        const res = await peopleService.getTenants({
          search,
          page: pages.tenants,
          limit,
          status: "active",
        });
        setTenants(res.items);
        setTotalTenants(res.total);
      } else {
        const res = await peopleService.getVendors({
          search,
          page: pages.vendors,
          limit,
        });
        setVendors(res.items);
        setTotalVendors(res.total);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setLoadingByTab((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPages({
      owners: 1,
      tenants: 1,
      vendors: 1,
    });
  };

  const currentItems = useMemo(() => {
    if (activeTab === "owners") return owners;
    if (activeTab === "tenants") return tenants;
    return vendors;
  }, [activeTab, owners, tenants, vendors]);

  const currentTotal = useMemo(() => {
    if (activeTab === "owners") return totalOwners;
    if (activeTab === "tenants") return totalTenants;
    return totalVendors;
  }, [activeTab, totalOwners, totalTenants, totalVendors]);

  const currentPage = useMemo(() => pages[activeTab], [pages, activeTab]);
  const currentLoading = useMemo(() => loadingByTab[activeTab], [loadingByTab, activeTab]);

  const handlePageChange = (
    tab: "owners" | "tenants" | "vendors",
    direction: "prev" | "next",
    total: number
  ) => {
    setPages((prev) => {
      const maxPage = Math.max(1, Math.ceil(total / limit));
      const current = prev[tab];
      const nextPage =
        direction === "prev" ? Math.max(1, current - 1) : Math.min(maxPage, current + 1);
      if (nextPage === current) return prev;
      return {
        ...prev,
        [tab]: nextPage,
      };
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Annuaire</h1>
        <p className="text-muted-foreground">
          Gestion des propriétaires, locataires et prestataires
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recherche</CardTitle>
              <CardDescription>
                Rechercher par nom, email ou téléphone
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="owners">
                <Building2 className="mr-2 h-4 w-4" />
                Propriétaires ({totalOwners})
              </TabsTrigger>
              <TabsTrigger value="tenants">
                <Users className="mr-2 h-4 w-4" />
                Locataires ({totalTenants})
              </TabsTrigger>
              <TabsTrigger value="vendors">
                <Wrench className="mr-2 h-4 w-4" />
                Prestataires ({totalVendors})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="owners" className="mt-6">
              {loadingByTab.owners && activeTab === "owners" ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Chargement...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Âge</TableHead>
                        <TableHead>Logements</TableHead>
                        <TableHead>Baux actifs</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {owners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Aucun propriétaire trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        owners.map((owner) => (
                          <TableRow key={owner.id}>
                            <TableCell className="font-medium">{owner.name}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded bg-muted text-xs capitalize">
                                {owner.type}
                              </span>
                            </TableCell>
                            <TableCell>{owner.email || "-"}</TableCell>
                            <TableCell>
                              {owner.age_years !== null && owner.age_years !== undefined
                                ? `${owner.age_years} ans`
                                : "N/A"}
                            </TableCell>
                            <TableCell>{owner.units_count}</TableCell>
                            <TableCell>{owner.active_leases}</TableCell>
                            <TableCell>
                              <Link href={`/admin/people/owners/${owner.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {totalOwners > limit && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {pages.owners} sur {Math.ceil(totalOwners / limit)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange("owners", "prev", totalOwners)}
                          disabled={pages.owners === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange("owners", "next", totalOwners)}
                          disabled={pages.owners >= Math.ceil(totalOwners / limit)}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tenants" className="mt-6">
              {loadingByTab.tenants && activeTab === "tenants" ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Chargement...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Âge</TableHead>
                        <TableHead>Logement</TableHead>
                        <TableHead>Statut bail</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Aucun locataire trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        tenants.map((tenant) => (
                          <TableRow key={tenant.id}>
                            <TableCell className="font-medium">{tenant.full_name}</TableCell>
                            <TableCell>{tenant.email || "-"}</TableCell>
                            <TableCell>{tenant.phone || "-"}</TableCell>
                            <TableCell>
                              {tenant.age_years !== null && tenant.age_years !== undefined
                                ? `${tenant.age_years} ans`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {tenant.property_address || "-"}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded bg-muted text-xs capitalize">
                                {tenant.lease_status || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Link href={`/admin/people/tenants/${tenant.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {totalTenants > limit && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {pages.tenants} sur {Math.ceil(totalTenants / limit)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange("tenants", "prev", totalTenants)}
                          disabled={pages.tenants === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange("tenants", "next", totalTenants)}
                          disabled={pages.tenants >= Math.ceil(totalTenants / limit)}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="vendors" className="mt-6">
              {loadingByTab.vendors && activeTab === "vendors" ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Chargement...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Zones</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun prestataire trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        vendors.map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell className="font-medium">{vendor.name}</TableCell>
                            <TableCell>{vendor.email || "-"}</TableCell>
                            <TableCell>{vendor.phone || "-"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {vendor.type_services.slice(0, 2).map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded bg-muted text-xs"
                                  >
                                    {service}
                                  </span>
                                ))}
                                {vendor.type_services.length > 2 && (
                                  <span className="px-2 py-1 rounded bg-muted text-xs">
                                    +{vendor.type_services.length - 2}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {vendor.zones_intervention || "-"}
                            </TableCell>
                            <TableCell>
                              <Link href={`/admin/people/vendors/${vendor.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {totalVendors > limit && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {pages.vendors} sur {Math.ceil(totalVendors / limit)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange("vendors", "prev", totalVendors)}
                          disabled={pages.vendors === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange("vendors", "next", totalVendors)}
                          disabled={pages.vendors >= Math.ceil(totalVendors / limit)}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PeopleDirectoryPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <PeopleDirectoryContent />
    </ProtectedRoute>
  );
}

