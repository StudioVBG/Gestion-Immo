/**
 * Service d'export de données
 * 
 * Permet d'exporter les données en différents formats :
 * - CSV
 * - Excel (XLSX)
 * - PDF
 * - JSON
 */

// Types
export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: "text" | "number" | "currency" | "date" | "percentage";
}

export interface ExportOptions {
  filename: string;
  format: ExportFormat;
  columns: ExportColumn[];
  title?: string;
  subtitle?: string;
  includeTimestamp?: boolean;
}

/**
 * Formate une valeur selon le type spécifié
 */
function formatValue(value: any, format?: ExportColumn["format"]): string {
  if (value === null || value === undefined) return "";
  
  switch (format) {
    case "currency":
      return typeof value === "number"
        ? `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
        : String(value);
    
    case "number":
      return typeof value === "number"
        ? value.toLocaleString("fr-FR")
        : String(value);
    
    case "percentage":
      return typeof value === "number"
        ? `${value.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}%`
        : String(value);
    
    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString("fr-FR");
      }
      if (typeof value === "string" && value.includes("T")) {
        return new Date(value).toLocaleDateString("fr-FR");
      }
      return String(value);
    
    default:
      return String(value);
  }
}

/**
 * Génère un fichier CSV
 */
export function generateCSV(data: any[], options: ExportOptions): string {
  const { columns, includeTimestamp } = options;
  const rows: string[] = [];
  
  // En-tête
  const headers = columns.map(col => `"${col.header}"`);
  rows.push(headers.join(";"));
  
  // Données
  data.forEach(item => {
    const row = columns.map(col => {
      const value = item[col.key];
      const formatted = formatValue(value, col.format);
      // Échapper les guillemets et entourer de guillemets
      return `"${formatted.replace(/"/g, '""')}"`;
    });
    rows.push(row.join(";"));
  });
  
  // Ajouter timestamp si demandé
  if (includeTimestamp) {
    rows.push("");
    rows.push(`"Généré le";${new Date().toLocaleString("fr-FR")}`);
  }
  
  return rows.join("\n");
}

/**
 * Génère un fichier JSON formaté
 */
export function generateJSON(data: any[], options: ExportOptions): string {
  const { columns, title, subtitle, includeTimestamp } = options;
  
  const exportData = {
    metadata: {
      title,
      subtitle,
      exportedAt: includeTimestamp ? new Date().toISOString() : undefined,
      recordCount: data.length,
    },
    columns: columns.map(col => ({
      key: col.key,
      header: col.header,
      format: col.format,
    })),
    data: data.map(item => {
      const record: Record<string, any> = {};
      columns.forEach(col => {
        record[col.key] = item[col.key];
      });
      return record;
    }),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Génère le HTML pour un rapport PDF
 */
export function generatePDFHTML(data: any[], options: ExportOptions): string {
  const { columns, title, subtitle, includeTimestamp } = options;
  
  const tableRows = data.map(item => {
    const cells = columns.map(col => {
      const value = item[col.key];
      const formatted = formatValue(value, col.format);
      const align = col.format === "currency" || col.format === "number" || col.format === "percentage" 
        ? "right" 
        : "left";
      return `<td style="text-align: ${align}; padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatted}</td>`;
    });
    return `<tr>${cells.join("")}</tr>`;
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title || "Export"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      padding: 40px;
      color: #333;
    }
    .header { 
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 { 
      color: #3b82f6;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .header p { 
      color: #666;
      font-size: 14px;
    }
    table { 
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    thead th {
      background: #f8fafc;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      border-bottom: 2px solid #e5e7eb;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #666;
    }
    .summary {
      margin-top: 20px;
      padding: 15px;
      background: #f0f9ff;
      border-radius: 8px;
    }
    .summary p {
      font-size: 14px;
      color: #0369a1;
    }
    @media print {
      body { padding: 20px; }
      .header { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${title ? `<h1>${title}</h1>` : ""}
    ${subtitle ? `<p>${subtitle}</p>` : ""}
  </div>
  
  <table>
    <thead>
      <tr>
        ${columns.map(col => `<th>${col.header}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${tableRows.join("")}
    </tbody>
  </table>
  
  <div class="summary">
    <p><strong>${data.length}</strong> enregistrement${data.length > 1 ? "s" : ""}</p>
  </div>
  
  ${includeTimestamp ? `
  <div class="footer">
    <p>Généré le ${new Date().toLocaleString("fr-FR")} - Talok</p>
  </div>
  ` : ""}
</body>
</html>
  `.trim();
}

/**
 * Déclenche le téléchargement d'un fichier
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Génère un fichier Excel (XLSX) natif
 * Utilise le format SpreadsheetML pour une compatibilité maximale
 */
export function generateXLSX(data: any[], options: ExportOptions): Blob {
  const { columns, title, includeTimestamp } = options;
  
  // Escape XML special characters
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  // Build rows
  const headerRow = columns.map((col, i) => 
    `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`
  ).join('');
  
  const dataRows = data.map(item => {
    const cells = columns.map(col => {
      const value = item[col.key];
      const formatted = formatValue(value, col.format);
      const type = col.format === "number" || col.format === "currency" || col.format === "percentage" 
        ? "Number" 
        : "String";
      
      // For numbers, remove formatting for Excel
      let cellValue = formatted;
      if (type === "Number" && typeof value === "number") {
        cellValue = String(value);
      }
      
      return `<Cell><Data ss:Type="${type}">${escapeXML(cellValue)}</Data></Cell>`;
    });
    return `<Row>${cells.join('')}</Row>`;
  });
  
  // Add summary row
  const summaryRow = includeTimestamp 
    ? `<Row><Cell><Data ss:Type="String">Généré le ${new Date().toLocaleString("fr-FR")}</Data></Cell></Row>`
    : '';
  
  // Build XML spreadsheet
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
      <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXML(title || 'Export')}">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows.join('\n      ')}
      ${summaryRow}
    </Table>
  </Worksheet>
</Workbook>`;

  return new Blob([xml], { type: 'application/vnd.ms-excel' });
}

/**
 * Exporte les données dans le format spécifié
 */
export function exportData(data: any[], options: ExportOptions): void {
  const { filename, format, includeTimestamp } = options;
  
  // Ajouter timestamp au nom de fichier si demandé
  const timestamp = includeTimestamp 
    ? `_${new Date().toISOString().slice(0, 10)}` 
    : "";
  const fullFilename = `${filename}${timestamp}`;
  
  let content: string;
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case "csv":
      content = generateCSV(data, options);
      mimeType = "text/csv;charset=utf-8";
      extension = "csv";
      break;
    
    case "json":
      content = generateJSON(data, options);
      mimeType = "application/json";
      extension = "json";
      break;
    
    case "pdf":
      content = generatePDFHTML(data, options);
      mimeType = "text/html";
      extension = "html"; // Pour l'instant, générer en HTML pour impression
      break;
    
    case "xlsx":
      // Export Excel natif
      const xlsxBlob = generateXLSX(data, options);
      downloadFile(xlsxBlob, `${fullFilename}.xls`, "application/vnd.ms-excel");
      return; // Exit early since we already called downloadFile
    
    default:
      throw new Error(`Format non supporté: ${format}`);
  }
  
  downloadFile(content, `${fullFilename}.${extension}`, mimeType);
}

// Configurations d'export prédéfinies
export const exportConfigs = {
  // Export des propriétés
  properties: {
    filename: "mes_biens",
    columns: [
      { key: "adresse_complete", header: "Adresse", format: "text" as const },
      { key: "ville", header: "Ville", format: "text" as const },
      { key: "code_postal", header: "Code postal", format: "text" as const },
      { key: "type", header: "Type", format: "text" as const },
      { key: "surface", header: "Surface (m²)", format: "number" as const },
      { key: "loyer_hc", header: "Loyer HC", format: "currency" as const },
      { key: "charges_mensuelles", header: "Charges", format: "currency" as const },
      { key: "statut", header: "Statut", format: "text" as const },
    ],
  },
  
  // Export des factures
  invoices: {
    filename: "factures",
    columns: [
      { key: "periode", header: "Période", format: "text" as const },
      { key: "tenant_name", header: "Locataire", format: "text" as const },
      { key: "property_address", header: "Bien", format: "text" as const },
      { key: "montant_loyer", header: "Loyer", format: "currency" as const },
      { key: "montant_charges", header: "Charges", format: "currency" as const },
      { key: "montant_total", header: "Total", format: "currency" as const },
      { key: "statut", header: "Statut", format: "text" as const },
      { key: "created_at", header: "Date création", format: "date" as const },
    ],
  },
  
  // Export des paiements
  payments: {
    filename: "paiements",
    columns: [
      { key: "date_paiement", header: "Date", format: "date" as const },
      { key: "tenant_name", header: "Locataire", format: "text" as const },
      { key: "montant", header: "Montant", format: "currency" as const },
      { key: "moyen", header: "Moyen", format: "text" as const },
      { key: "statut", header: "Statut", format: "text" as const },
    ],
  },
  
  // Export des baux
  leases: {
    filename: "contrats",
    columns: [
      { key: "property_address", header: "Bien", format: "text" as const },
      { key: "tenant_name", header: "Locataire", format: "text" as const },
      { key: "type_bail", header: "Type", format: "text" as const },
      { key: "date_debut", header: "Début", format: "date" as const },
      { key: "date_fin", header: "Fin", format: "date" as const },
      { key: "loyer", header: "Loyer", format: "currency" as const },
      { key: "charges_forfaitaires", header: "Charges", format: "currency" as const },
      { key: "statut", header: "Statut", format: "text" as const },
    ],
  },
  
  // Export fiscal
  fiscal: {
    filename: "rapport_fiscal",
    columns: [
      { key: "property_address", header: "Bien", format: "text" as const },
      { key: "revenus_bruts", header: "Revenus bruts", format: "currency" as const },
      { key: "charges_deductibles", header: "Charges déductibles", format: "currency" as const },
      { key: "interets_emprunt", header: "Intérêts emprunt", format: "currency" as const },
      { key: "travaux", header: "Travaux", format: "currency" as const },
      { key: "revenus_nets", header: "Revenus nets", format: "currency" as const },
    ],
  },
};

/**
 * Exporte les propriétés
 */
export function exportProperties(properties: any[], format: ExportFormat = "csv") {
  exportData(properties, {
    ...exportConfigs.properties,
    format,
    title: "Liste des biens immobiliers",
    subtitle: `${properties.length} bien${properties.length > 1 ? "s" : ""}`,
    includeTimestamp: true,
  });
}

/**
 * Exporte les factures
 */
export function exportInvoices(invoices: any[], format: ExportFormat = "csv") {
  exportData(invoices, {
    ...exportConfigs.invoices,
    format,
    title: "Liste des factures",
    subtitle: `${invoices.length} facture${invoices.length > 1 ? "s" : ""}`,
    includeTimestamp: true,
  });
}

/**
 * Exporte les paiements
 */
export function exportPayments(payments: any[], format: ExportFormat = "csv") {
  exportData(payments, {
    ...exportConfigs.payments,
    format,
    title: "Historique des paiements",
    includeTimestamp: true,
  });
}

/**
 * Exporte les baux
 */
export function exportLeases(leases: any[], format: ExportFormat = "csv") {
  exportData(leases, {
    ...exportConfigs.leases,
    format,
    title: "Liste des contrats de location",
    includeTimestamp: true,
  });
}

// ============================================
// EXPORT FEC (Fichier des Écritures Comptables)
// Format légal français - Article A47 A-1 du LPF
// ============================================

export interface FECEntry {
  JournalCode: string;        // Code journal
  JournalLib: string;         // Libellé journal
  EcritureNum: string;        // Numéro d'écriture
  EcritureDate: string;       // Date écriture (YYYYMMDD)
  CompteNum: string;          // Numéro de compte
  CompteLib: string;          // Libellé compte
  CompAuxNum: string;         // Compte auxiliaire
  CompAuxLib: string;         // Libellé compte auxiliaire
  PieceRef: string;           // Référence pièce
  PieceDate: string;          // Date pièce (YYYYMMDD)
  EcritureLib: string;        // Libellé écriture
  Debit: string;              // Montant débit (format 0.00)
  Credit: string;             // Montant crédit (format 0.00)
  EcritureLet: string;        // Lettrage
  DateLet: string;            // Date lettrage
  ValidDate: string;          // Date validation
  Montantdevise: string;      // Montant devise
  Idevise: string;            // Code devise (EUR)
}

/**
 * Génère un fichier FEC conforme à l'article A47 A-1 du LPF
 */
export function generateFEC(entries: FECEntry[], siren: string, periodEnd: string): string {
  const rows: string[] = [];

  // En-tête FEC (18 colonnes obligatoires)
  const headers = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
  ];
  rows.push(headers.join("\t"));

  // Données
  entries.forEach(entry => {
    const row = [
      entry.JournalCode,
      entry.JournalLib,
      entry.EcritureNum,
      entry.EcritureDate,
      entry.CompteNum,
      entry.CompteLib,
      entry.CompAuxNum || "",
      entry.CompAuxLib || "",
      entry.PieceRef,
      entry.PieceDate,
      entry.EcritureLib,
      entry.Debit,
      entry.Credit,
      entry.EcritureLet || "",
      entry.DateLet || "",
      entry.ValidDate || "",
      entry.Montantdevise || "",
      entry.Idevise || "EUR",
    ];
    rows.push(row.join("\t"));
  });

  return rows.join("\r\n");
}

/**
 * Convertit les paiements TALOK en écritures FEC
 */
export function convertPaymentsToFEC(payments: any[], year: number): FECEntry[] {
  const entries: FECEntry[] = [];
  let ecritureNum = 1;

  // Plan comptable simplifié pour la gestion locative
  const COMPTES = {
    LOYERS: "706100",          // Produits - Loyers
    CHARGES: "706200",         // Produits - Charges locatives
    BANQUE: "512000",          // Banque
    CAISSE: "530000",          // Caisse (espèces)
    LOCATAIRES: "411000",      // Clients - Locataires
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  };

  const formatAmount = (amount: number): string => {
    return amount.toFixed(2).replace(".", ",");
  };

  payments.forEach(payment => {
    const paymentDate = formatDate(payment.date_paiement || payment.created_at);
    const numPrefix = String(ecritureNum).padStart(6, "0");

    // Écriture 1: Débit Banque/Caisse
    const compteDebit = payment.moyen === "especes" ? COMPTES.CAISSE : COMPTES.BANQUE;
    const journalCode = payment.moyen === "especes" ? "CA" : "BQ";
    const journalLib = payment.moyen === "especes" ? "Caisse" : "Banque";

    entries.push({
      JournalCode: journalCode,
      JournalLib: journalLib,
      EcritureNum: `${year}${numPrefix}`,
      EcritureDate: paymentDate,
      CompteNum: compteDebit,
      CompteLib: journalLib,
      CompAuxNum: "",
      CompAuxLib: "",
      PieceRef: payment.provider_ref || payment.id.slice(0, 8).toUpperCase(),
      PieceDate: paymentDate,
      EcritureLib: `Loyer ${payment.periode || ""}`,
      Debit: formatAmount(payment.montant),
      Credit: "0,00",
      EcritureLet: "",
      DateLet: "",
      ValidDate: paymentDate,
      Montantdevise: "",
      Idevise: "EUR",
    });

    // Écriture 2: Crédit Loyers
    entries.push({
      JournalCode: journalCode,
      JournalLib: journalLib,
      EcritureNum: `${year}${numPrefix}`,
      EcritureDate: paymentDate,
      CompteNum: COMPTES.LOYERS,
      CompteLib: "Loyers",
      CompAuxNum: payment.tenant_id ? `LOC${payment.tenant_id.slice(0, 6).toUpperCase()}` : "",
      CompAuxLib: payment.tenant_name || "",
      PieceRef: payment.provider_ref || payment.id.slice(0, 8).toUpperCase(),
      PieceDate: paymentDate,
      EcritureLib: `Loyer ${payment.periode || ""}`,
      Debit: "0,00",
      Credit: formatAmount(payment.montant_loyer || payment.montant * 0.9), // 90% loyer par défaut
      EcritureLet: "",
      DateLet: "",
      ValidDate: paymentDate,
      Montantdevise: "",
      Idevise: "EUR",
    });

    // Écriture 3: Crédit Charges (si applicable)
    const chargesAmount = payment.montant_charges || payment.montant * 0.1;
    if (chargesAmount > 0) {
      entries.push({
        JournalCode: journalCode,
        JournalLib: journalLib,
        EcritureNum: `${year}${numPrefix}`,
        EcritureDate: paymentDate,
        CompteNum: COMPTES.CHARGES,
        CompteLib: "Charges locatives",
        CompAuxNum: payment.tenant_id ? `LOC${payment.tenant_id.slice(0, 6).toUpperCase()}` : "",
        CompAuxLib: payment.tenant_name || "",
        PieceRef: payment.provider_ref || payment.id.slice(0, 8).toUpperCase(),
        PieceDate: paymentDate,
        EcritureLib: `Charges ${payment.periode || ""}`,
        Debit: "0,00",
        Credit: formatAmount(chargesAmount),
        EcritureLet: "",
        DateLet: "",
        ValidDate: paymentDate,
        Montantdevise: "",
        Idevise: "EUR",
      });
    }

    ecritureNum++;
  });

  return entries;
}

/**
 * Exporte les paiements au format FEC
 */
export function exportFEC(payments: any[], siren: string, year: number): void {
  const entries = convertPaymentsToFEC(payments, year);
  const periodEnd = `${year}1231`;
  const content = generateFEC(entries, siren, periodEnd);

  // Nom de fichier conforme: SIREN_FEC_AAAAMMJJ.txt
  const filename = `${siren.replace(/\s/g, "")}_FEC_${periodEnd}`;

  downloadFile(content, `${filename}.txt`, "text/plain;charset=utf-8");
}

/**
 * Export comptable simplifié pour Excel
 */
export function exportAccountingExcel(data: {
  payments: any[];
  invoices: any[];
  year: number;
  ownerName: string;
}): void {
  const { payments, invoices, year, ownerName } = data;

  // Calculs récapitulatifs
  const totalLoyers = payments
    .filter(p => p.statut === "succeeded")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const totalFacture = invoices.reduce((sum, i) => sum + (i.montant_total || 0), 0);
  const totalPaye = invoices.filter(i => i.statut === "paid").reduce((sum, i) => sum + (i.montant_total || 0), 0);
  const totalImpayes = totalFacture - totalPaye;

  // Préparer les données pour l'export
  const summaryData = [
    { label: "Propriétaire", value: ownerName, format: "text" },
    { label: "Année fiscale", value: String(year), format: "text" },
    { label: "Total facturé", value: totalFacture, format: "currency" },
    { label: "Total encaissé", value: totalPaye, format: "currency" },
    { label: "Impayés", value: totalImpayes, format: "currency" },
    { label: "Nombre de factures", value: invoices.length, format: "number" },
    { label: "Nombre de paiements", value: payments.length, format: "number" },
  ];

  const summaryColumns: ExportColumn[] = [
    { key: "label", header: "Indicateur", format: "text" },
    { key: "value", header: "Valeur", format: "text" },
  ];

  exportData(summaryData, {
    filename: `comptabilite_${year}`,
    format: "xlsx",
    columns: summaryColumns,
    title: `Récapitulatif comptable ${year}`,
    subtitle: ownerName,
    includeTimestamp: true,
  });
}

export default {
  exportData,
  exportProperties,
  exportInvoices,
  exportPayments,
  exportLeases,
  generateCSV,
  generateJSON,
  generatePDFHTML,
  downloadFile,
  exportConfigs,
  // FEC exports
  generateFEC,
  convertPaymentsToFEC,
  exportFEC,
  exportAccountingExcel,
};

