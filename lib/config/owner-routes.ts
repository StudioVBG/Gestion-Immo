/**
 * Configuration des routes pour le compte propriétaire
 */

export const OWNER_BASE_PATH = "/app/owner";

export const OWNER_ROUTES = {
  dashboard: {
    path: "/app/owner/dashboard",
    name: "Tableau de bord",
    component: "OwnerDashboardPage",
    auth: ["owner"],
    icon: "LayoutDashboard",
  },
  properties: {
    path: "/app/owner/properties",
    name: "Mes biens",
    component: "OwnerPropertiesPage",
    auth: ["owner"],
    icon: "Building2",
  },
  contracts: {
    path: "/app/owner/contracts",
    name: "Baux & locataires",
    component: "OwnerContractsPage",
    auth: ["owner"],
    icon: "FileText",
  },
  money: {
    path: "/app/owner/money",
    name: "Loyers & revenus",
    component: "OwnerMoneyPage",
    auth: ["owner"],
    icon: "Euro",
  },
  documents: {
    path: "/app/owner/documents",
    name: "Documents",
    component: "OwnerDocumentsPage",
    auth: ["owner"],
    icon: "FileCheck",
  },
  support: {
    path: "/app/owner/support",
    name: "Aide & services",
    component: "OwnerSupportPage",
    auth: ["owner"],
    icon: "HelpCircle",
  },
  profile: {
    path: "/app/owner/profile",
    name: "Mon profil",
    component: "OwnerProfilePage",
    auth: ["owner"],
    icon: "User",
  },
} as const;

export type OwnerRouteKey = keyof typeof OWNER_ROUTES;

