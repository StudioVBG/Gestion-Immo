/**
 * Template HTML pour l'État des Lieux (EDL)
 * Conforme au décret du 30 mars 2016
 */

export const EDL_TEMPLATE = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>État des lieux {{EDL_TYPE_LABEL}} - {{EDL_REFERENCE}}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1a1a1a;
      background: white;
    }
    
    .page {
      page-break-after: always;
      padding: 0;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 15px;
      border-bottom: 3px solid #1e40af;
      margin-bottom: 20px;
    }
    
    .header-left h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 4px;
    }
    
    .header-left .edl-type {
      font-size: 14pt;
      font-weight: 600;
      color: {{EDL_TYPE_COLOR}};
      text-transform: uppercase;
    }
    
    .header-right {
      text-align: right;
    }
    
    .reference-box {
      background: #f1f5f9;
      padding: 10px 15px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    
    .reference-box .label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
    }
    
    .reference-box .value {
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
      font-family: 'Courier New', monospace;
    }
    
    /* Sections */
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: 700;
      color: #1e40af;
      padding: 8px 12px;
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      border-left: 4px solid #1e40af;
      margin-bottom: 12px;
      border-radius: 0 4px 4px 0;
    }
    
    .section-content {
      padding: 0 5px;
    }
    
    /* Grid layout */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    /* Info boxes */
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }
    
    .info-box h3 {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 4px;
    }
    
    .info-row .label {
      font-weight: 500;
      color: #64748b;
      width: 120px;
      flex-shrink: 0;
    }
    
    .info-row .value {
      color: #1e293b;
      font-weight: 500;
    }
    
    /* Compteurs */
    .meter-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .meter-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .meter-icon {
      font-size: 24pt;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 8px;
    }
    
    .meter-info .meter-type {
      font-weight: 600;
      color: #1e293b;
      font-size: 10pt;
    }
    
    .meter-info .meter-number {
      font-size: 8pt;
      color: #64748b;
    }
    
    .meter-info .meter-value {
      font-size: 14pt;
      font-weight: 700;
      color: #1e40af;
      margin-top: 4px;
    }
    
    /* Pièces */
    .room-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .room-header {
      background: #1e293b;
      color: white;
      padding: 10px 15px;
      border-radius: 6px 6px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .room-name {
      font-size: 11pt;
      font-weight: 600;
    }
    
    .room-badge {
      font-size: 9pt;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 500;
    }
    
    .room-badge.good {
      background: #22c55e;
    }
    
    .room-badge.mixed {
      background: #eab308;
      color: #1a1a1a;
    }
    
    .room-badge.bad {
      background: #ef4444;
    }
    
    .room-items {
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 6px 6px;
    }
    
    .item-row {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .item-row:last-child {
      border-bottom: none;
    }
    
    .item-row:nth-child(even) {
      background: #fafafa;
    }
    
    .item-name {
      flex: 1;
      font-weight: 500;
      color: #374151;
    }
    
    .item-condition {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 600;
      text-align: center;
      min-width: 100px;
    }
    
    .item-condition.bon {
      background: #dcfce7;
      color: #166534;
    }
    
    .item-condition.moyen {
      background: #fef9c3;
      color: #854d0e;
    }
    
    .item-condition.mauvais {
      background: #fed7aa;
      color: #c2410c;
    }
    
    .item-condition.tres_mauvais {
      background: #fecaca;
      color: #b91c1c;
    }
    
    .item-notes {
      width: 100%;
      padding: 6px 12px;
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      font-size: 9pt;
      font-style: italic;
      color: #92400e;
      margin: 4px 12px 8px 12px;
    }
    
    /* Photos section */
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 8px;
      padding: 8px 12px;
    }
    
    .photo-thumb {
      aspect-ratio: 1;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    
    .photo-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    /* Clés */
    .keys-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .keys-table th,
    .keys-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .keys-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      font-size: 9pt;
      text-transform: uppercase;
    }
    
    .keys-table td {
      font-size: 10pt;
    }
    
    .key-qty {
      font-weight: 700;
      color: #1e40af;
      font-size: 12pt;
    }
    
    /* Résumé état */
    .summary-stats {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .stat-card {
      flex: 1;
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      border: 2px solid;
    }
    
    .stat-card.bon {
      background: #f0fdf4;
      border-color: #22c55e;
    }
    
    .stat-card.moyen {
      background: #fefce8;
      border-color: #eab308;
    }
    
    .stat-card.mauvais {
      background: #fff7ed;
      border-color: #f97316;
    }
    
    .stat-card.tres_mauvais {
      background: #fef2f2;
      border-color: #ef4444;
    }
    
    .stat-number {
      font-size: 20pt;
      font-weight: 700;
    }
    
    .stat-card.bon .stat-number { color: #166534; }
    .stat-card.moyen .stat-number { color: #854d0e; }
    .stat-card.mauvais .stat-number { color: #c2410c; }
    .stat-card.tres_mauvais .stat-number { color: #b91c1c; }
    
    .stat-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 4px;
    }
    
    /* Observations */
    .observations-box {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 15px;
    }
    
    .observations-box h4 {
      font-size: 10pt;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .observations-box p {
      font-size: 10pt;
      color: #78350f;
      line-height: 1.5;
    }
    
    /* Signatures */
    .signatures-section {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    
    .signature-box {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      min-height: 200px;
    }
    
    .signature-box h4 {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .signature-name {
      font-size: 11pt;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 15px;
    }
    
    .signature-area {
      height: 100px;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      margin-bottom: 10px;
    }
    
    .signature-area img {
      max-height: 90px;
      max-width: 90%;
    }
    
    .signature-area .placeholder {
      color: #94a3b8;
      font-size: 9pt;
    }
    
    .signature-date {
      font-size: 9pt;
      color: #64748b;
    }
    
    /* Legal footer */
    .legal-footer {
      margin-top: 30px;
      padding: 15px;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 8pt;
      color: #64748b;
      line-height: 1.6;
    }
    
    .legal-footer p {
      margin-bottom: 6px;
    }
    
    /* Print specifics */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .page {
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    /* Empty state for printable template */
    .empty-field {
      border-bottom: 1px dotted #94a3b8;
      min-width: 150px;
      display: inline-block;
      height: 1.2em;
    }
    
    .checkbox-empty {
      width: 14px;
      height: 14px;
      border: 1px solid #64748b;
      border-radius: 2px;
      display: inline-block;
      vertical-align: middle;
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <!-- Page 1: Informations générales -->
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>ÉTAT DES LIEUX</h1>
        <div class="edl-type">{{EDL_TYPE_LABEL}}</div>
      </div>
      <div class="header-right">
        <div class="reference-box">
          <div class="label">Référence</div>
          <div class="value">{{EDL_REFERENCE}}</div>
        </div>
      </div>
    </div>
    
    <!-- Date et informations -->
    <div class="section">
      <div class="section-title">📅 Date de l'état des lieux</div>
      <div class="section-content">
        <div class="info-box">
          <div class="info-row">
            <span class="label">Date :</span>
            <span class="value">{{DATE_EDL}}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Parties -->
    <div class="section">
      <div class="section-title">👥 Les parties</div>
      <div class="section-content">
        <div class="grid-2">
          <!-- Bailleur -->
          <div class="info-box">
            <h3>Le Bailleur</h3>
            <div class="info-row">
              <span class="label">{{BAILLEUR_LABEL_NOM}} :</span>
              <span class="value">{{BAILLEUR_NOM_COMPLET}}</span>
            </div>
            {{#if IS_SOCIETE}}
            <div class="info-row">
              <span class="label">Représenté par :</span>
              <span class="value">{{BAILLEUR_REPRESENTANT}}</span>
            </div>
            {{/if}}
            <div class="info-row">
              <span class="label">Adresse :</span>
              <span class="value">{{BAILLEUR_ADRESSE}}</span>
            </div>
            <div class="info-row">
              <span class="label">Téléphone :</span>
              <span class="value">{{BAILLEUR_TELEPHONE}}</span>
            </div>
            <div class="info-row">
              <span class="label">Email :</span>
              <span class="value">{{BAILLEUR_EMAIL}}</span>
            </div>
          </div>
          
          <!-- Locataire(s) -->
          <div class="info-box">
            <h3>Le(s) Locataire(s)</h3>
            <div class="info-row">
              <span class="label">Nom :</span>
              <span class="value">{{LOCATAIRES_NOM_COMPLET}}</span>
            </div>
            <div class="info-row">
              <span class="label">Téléphone :</span>
              <span class="value">{{LOCATAIRES_TELEPHONE}}</span>
            </div>
            <div class="info-row">
              <span class="label">Email :</span>
              <span class="value">{{LOCATAIRES_EMAIL}}</span>
            </div>
            {{LOCATAIRES_LISTE}}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Logement -->
    <div class="section">
      <div class="section-title">🏠 Le logement</div>
      <div class="section-content">
        <div class="info-box">
          <div class="grid-2">
            <div>
              <div class="info-row">
                <span class="label">Adresse :</span>
                <span class="value">{{LOGEMENT_ADRESSE}}</span>
              </div>
              <div class="info-row">
                <span class="label">Code postal :</span>
                <span class="value">{{LOGEMENT_CODE_POSTAL}}</span>
              </div>
              <div class="info-row">
                <span class="label">Ville :</span>
                <span class="value">{{LOGEMENT_VILLE}}</span>
              </div>
            </div>
            <div>
              <div class="info-row">
                <span class="label">Type :</span>
                <span class="value">{{LOGEMENT_TYPE}}</span>
              </div>
              <div class="info-row">
                <span class="label">Surface :</span>
                <span class="value">{{LOGEMENT_SURFACE}} m²</span>
              </div>
              <div class="info-row">
                <span class="label">Pièces :</span>
                <span class="value">{{LOGEMENT_NB_PIECES}}</span>
              </div>
              {{#if LOGEMENT_ETAGE}}
              <div class="info-row">
                <span class="label">Étage :</span>
                <span class="value">{{LOGEMENT_ETAGE}}</span>
              </div>
              {{/if}}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bail associé -->
    <div class="section">
      <div class="section-title">📄 Bail associé</div>
      <div class="section-content">
        <div class="info-box">
          <div class="grid-2">
            <div>
              <div class="info-row">
                <span class="label">Référence :</span>
                <span class="value">{{BAIL_REFERENCE}}</span>
              </div>
              <div class="info-row">
                <span class="label">Type :</span>
                <span class="value">{{BAIL_TYPE}}</span>
              </div>
            </div>
            <div>
              <div class="info-row">
                <span class="label">Date début :</span>
                <span class="value">{{BAIL_DATE_DEBUT}}</span>
              </div>
              <div class="info-row">
                <span class="label">Loyer total :</span>
                <span class="value">{{BAIL_TOTAL}} / mois</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Compteurs -->
    {{#if HAS_COMPTEURS}}
    <div class="section">
      <div class="section-title">⚡ Relevés des compteurs</div>
      <div class="section-content">
        <div class="meter-grid">
          {{COMPTEURS_HTML}}
        </div>
      </div>
    </div>
    {{/if}}
  </div>
  
  <!-- Pages suivantes: Détail pièce par pièce -->
  <div class="page">
    <div class="header" style="margin-bottom: 15px;">
      <div class="header-left">
        <h1 style="font-size: 16pt;">ÉTAT DES LIEUX - Détail des pièces</h1>
        <div class="edl-type" style="font-size: 11pt;">{{EDL_REFERENCE}}</div>
      </div>
    </div>
    
    <!-- Résumé global -->
    <div class="section">
      <div class="section-title">📊 Résumé de l'état général</div>
      <div class="section-content">
        <div class="summary-stats">
          <div class="stat-card bon">
            <div class="stat-number">{{NB_ELEMENTS_BON}}</div>
            <div class="stat-label">Bon état</div>
          </div>
          <div class="stat-card moyen">
            <div class="stat-number">{{NB_ELEMENTS_MOYEN}}</div>
            <div class="stat-label">État moyen</div>
          </div>
          <div class="stat-card mauvais">
            <div class="stat-number">{{NB_ELEMENTS_MAUVAIS}}</div>
            <div class="stat-label">Mauvais état</div>
          </div>
          <div class="stat-card tres_mauvais">
            <div class="stat-number">{{NB_ELEMENTS_TRES_MAUVAIS}}</div>
            <div class="stat-label">Très mauvais</div>
          </div>
        </div>
        <p style="font-size: 9pt; color: #64748b; text-align: center;">
          {{POURCENTAGE_BON_ETAT}}% des éléments sont en bon état
        </p>
      </div>
    </div>
    
    <!-- Détail des pièces -->
    {{PIECES_HTML}}
  </div>
  
  <!-- Page finale: Clés, Observations et Signatures -->
  <div class="page">
    <div class="header" style="margin-bottom: 15px;">
      <div class="header-left">
        <h1 style="font-size: 16pt;">ÉTAT DES LIEUX - Conclusion</h1>
        <div class="edl-type" style="font-size: 11pt;">{{EDL_REFERENCE}}</div>
      </div>
    </div>
    
    <!-- Clés remises -->
    {{#if HAS_CLES}}
    <div class="section">
      <div class="section-title">🔑 Clés remises</div>
      <div class="section-content">
        <table class="keys-table">
          <thead>
            <tr>
              <th>Type de clé</th>
              <th>Quantité</th>
              <th>Observations</th>
            </tr>
          </thead>
          <tbody>
            {{CLES_HTML}}
          </tbody>
        </table>
      </div>
    </div>
    {{/if}}
    
    <!-- Observations générales -->
    {{#if HAS_OBSERVATIONS}}
    <div class="section">
      <div class="section-title">📝 Observations générales</div>
      <div class="section-content">
        <div class="observations-box">
          <p>{{OBSERVATIONS_GENERALES}}</p>
        </div>
      </div>
    </div>
    {{/if}}
    
    <!-- Mention légale -->
    <div class="legal-footer">
      <p><strong>Mentions obligatoires :</strong></p>
      <p>Le présent état des lieux, établi contradictoirement entre les parties, fait partie intégrante du contrat de location dont il ne peut être dissocié.</p>
      <p>Conformément à la loi du 6 juillet 1989 (article 3-2) et au décret n°2016-382 du 30 mars 2016, l'état des lieux est établi lors de la remise et de la restitution des clés.</p>
      <p>Les parties reconnaissent avoir établi le présent état des lieux de manière contradictoire et en avoir reçu chacune un exemplaire.</p>
      {{#if IS_EDL_SORTIE}}
      <p><strong>En cas de sortie :</strong> Le présent état des lieux de sortie sera comparé à l'état des lieux d'entrée pour déterminer les éventuelles dégradations imputables au locataire.</p>
      {{/if}}
    </div>
    
    <!-- Signatures -->
    <div class="signatures-section">
      <div class="section-title">✍️ Signatures des parties</div>
      <div class="signatures-grid">
        <!-- Signature Bailleur -->
        <div class="signature-box">
          <h4>Le Bailleur</h4>
          <div class="signature-name">{{BAILLEUR_NOM_COMPLET}}</div>
          <div class="signature-area">
            {{#if SIGNATURE_IMAGE_BAILLEUR}}
            <img src="{{SIGNATURE_IMAGE_BAILLEUR}}" alt="Signature bailleur" />
            {{else}}
            <span class="placeholder">Signature en attente</span>
            {{/if}}
          </div>
          <div class="signature-date">
            {{#if DATE_SIGNATURE_BAILLEUR}}
            Signé le : {{DATE_SIGNATURE_BAILLEUR}}
            {{else}}
            Date : ____________________
            {{/if}}
          </div>
          <p style="font-size: 8pt; color: #64748b; margin-top: 8px;">Lu et approuvé, bon pour accord</p>
        </div>
        
        <!-- Signature Locataire -->
        <div class="signature-box">
          <h4>Le Locataire</h4>
          <div class="signature-name">{{LOCATAIRES_NOM_COMPLET}}</div>
          <div class="signature-area">
            {{#if SIGNATURE_IMAGE_LOCATAIRE}}
            <img src="{{SIGNATURE_IMAGE_LOCATAIRE}}" alt="Signature locataire" />
            {{else}}
            <span class="placeholder">Signature en attente</span>
            {{/if}}
          </div>
          <div class="signature-date">
            {{#if DATE_SIGNATURE_LOCATAIRE}}
            Signé le : {{DATE_SIGNATURE_LOCATAIRE}}
            {{else}}
            Date : ____________________
            {{/if}}
          </div>
          <p style="font-size: 8pt; color: #64748b; margin-top: 8px;">Lu et approuvé, bon pour accord</p>
        </div>
      </div>
    </div>
    
    <!-- Footer avec date de génération -->
    <div style="margin-top: 30px; text-align: center; font-size: 8pt; color: #94a3b8;">
      Document généré le {{DATE_CREATION}} | Référence : {{EDL_REFERENCE}}
    </div>
  </div>
</body>
</html>
`;

/**
 * Template vierge pour impression (pack Gratuit/Starter)
 */
export const EDL_TEMPLATE_VIERGE = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>État des lieux - À remplir</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.3;
      color: #000;
    }
    
    .page {
      page-break-after: always;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    h1 {
      font-size: 16pt;
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    
    h2 {
      font-size: 11pt;
      background: #f0f0f0;
      padding: 5px 10px;
      margin: 12px 0 8px 0;
      border-left: 3px solid #333;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .info-box {
      border: 1px solid #ccc;
      padding: 8px;
      border-radius: 4px;
    }
    
    .field-row {
      display: flex;
      margin-bottom: 6px;
      align-items: baseline;
    }
    
    .field-label {
      font-weight: bold;
      width: 100px;
      flex-shrink: 0;
    }
    
    .field-value {
      flex: 1;
      border-bottom: 1px dotted #999;
      min-height: 14px;
    }
    
    .checkbox-group {
      display: flex;
      gap: 15px;
      margin-top: 5px;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .checkbox {
      width: 12px;
      height: 12px;
      border: 1px solid #333;
      display: inline-block;
    }
    
    /* Table pour les pièces */
    .room-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 8pt;
    }
    
    .room-table th,
    .room-table td {
      border: 1px solid #999;
      padding: 4px 6px;
      text-align: left;
    }
    
    .room-table th {
      background: #e0e0e0;
      font-weight: bold;
    }
    
    .room-table .condition-col {
      width: 100px;
      text-align: center;
    }
    
    .room-table .notes-col {
      width: 150px;
    }
    
    /* Compteurs */
    .meter-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    .meter-table th,
    .meter-table td {
      border: 1px solid #999;
      padding: 8px;
      text-align: center;
    }
    
    .meter-table th {
      background: #e0e0e0;
    }
    
    /* Signatures */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    
    .signature-box {
      border: 1px solid #999;
      padding: 10px;
      min-height: 120px;
    }
    
    .signature-box h4 {
      font-size: 9pt;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ccc;
    }
    
    .signature-line {
      margin-top: 60px;
      border-top: 1px solid #000;
      text-align: center;
      font-size: 8pt;
      padding-top: 4px;
    }
    
    .legal-text {
      font-size: 7pt;
      color: #666;
      margin-top: 15px;
      padding: 8px;
      background: #f5f5f5;
      border: 1px solid #ddd;
    }
    
    .room-name-input {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Page 1: Informations générales -->
  <div class="page">
    <h1>ÉTAT DES LIEUX {{EDL_TYPE_LABEL}}</h1>
    
    <div class="checkbox-group" style="justify-content: center; margin-bottom: 15px;">
      <div class="checkbox-item">
        <span class="checkbox"></span>
        <span>Entrée</span>
      </div>
      <div class="checkbox-item">
        <span class="checkbox"></span>
        <span>Sortie</span>
      </div>
    </div>
    
    <h2>📅 Date de l'état des lieux</h2>
    <div class="field-row">
      <span class="field-label">Date :</span>
      <span class="field-value">{{DATE_EDL}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Heure :</span>
      <span class="field-value"></span>
    </div>
    
    <h2>👥 Les parties</h2>
    <div class="info-grid">
      <div class="info-box">
        <strong>LE BAILLEUR</strong>
        <div class="field-row">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{BAILLEUR_NOM_COMPLET}}</span>
        </div>
        {{#if BAILLEUR_REPRESENTANT}}
        <div class="field-row">
          <span class="field-label">Représenté par :</span>
          <span class="field-value">{{BAILLEUR_REPRESENTANT}}</span>
        </div>
        {{/if}}
        <div class="field-row">
          <span class="field-label">Adresse :</span>
          <span class="field-value">{{BAILLEUR_ADRESSE}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Téléphone :</span>
          <span class="field-value">{{BAILLEUR_TELEPHONE}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Email :</span>
          <span class="field-value">{{BAILLEUR_EMAIL}}</span>
        </div>
      </div>
      <div class="info-box">
        <strong>LE LOCATAIRE</strong>
        <div class="field-row">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{LOCATAIRES_NOM_COMPLET}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Téléphone :</span>
          <span class="field-value">{{LOCATAIRES_TELEPHONE}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Email :</span>
          <span class="field-value">{{LOCATAIRES_EMAIL}}</span>
        </div>
      </div>
    </div>
    
    <h2>🏠 Le logement</h2>
    <div class="info-box">
      <div class="field-row">
        <span class="field-label">Adresse :</span>
        <span class="field-value">{{LOGEMENT_ADRESSE}}</span>
      </div>
      <div class="info-grid" style="margin-top: 8px;">
        <div class="field-row">
          <span class="field-label">Code postal :</span>
          <span class="field-value">{{LOGEMENT_CODE_POSTAL}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Ville :</span>
          <span class="field-value">{{LOGEMENT_VILLE}}</span>
        </div>
      </div>
      <div class="info-grid">
        <div class="field-row">
          <span class="field-label">Type :</span>
          <span class="field-value">{{LOGEMENT_TYPE}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Surface :</span>
          <span class="field-value">{{LOGEMENT_SURFACE}} m²</span>
        </div>
      </div>
      <div class="info-grid">
        <div class="field-row">
          <span class="field-label">Nb pièces :</span>
          <span class="field-value">{{LOGEMENT_NB_PIECES}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Étage :</span>
          <span class="field-value">{{LOGEMENT_ETAGE}}</span>
        </div>
      </div>
    </div>
    
    <h2>⚡ Relevés des compteurs</h2>
    <table class="meter-table">
      <thead>
        <tr>
          <th>Compteur</th>
          <th>N° Compteur</th>
          <th>Index</th>
          <th>Unité</th>
        </tr>
      </thead>
      <tbody>
        {{COMPTEURS_HTML}}
      </tbody>
    </table>
  </div>
  
  <!-- Pages de pièces -->
  {{PIECES_VIERGES_HTML}}
  
  <!-- Page finale: Signatures -->
  <div class="page">
    <h1>ÉTAT DES LIEUX - Conclusion</h1>
    
    <h2>🔑 Clés remises</h2>
    <table class="meter-table">
      <thead>
        <tr>
          <th>Type de clé</th>
          <th>Quantité</th>
          <th>Observations</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Porte d'entrée</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>Boîte aux lettres</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>Cave/Parking</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>Badge/Télécommande</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>Autre :</td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
    
    <h2>📝 Observations générales</h2>
    <div style="border: 1px solid #999; min-height: 100px; padding: 8px;">
      {{OBSERVATIONS_GENERALES}}
    </div>
    
    <div class="legal-text">
      <strong>Mentions obligatoires :</strong> Le présent état des lieux, établi contradictoirement entre les parties, fait partie intégrante du contrat de location dont il ne peut être dissocié. Conformément à la loi du 6 juillet 1989 et au décret n°2016-382 du 30 mars 2016, l'état des lieux est établi lors de la remise et de la restitution des clés.
    </div>
    
    <h2>✍️ Signatures</h2>
    <div class="signatures">
      <div class="signature-box">
        <h4>Le Bailleur</h4>
        <p style="font-size: 8pt;">Nom : {{BAILLEUR_NOM_COMPLET}}</p>
        <div class="signature-line">Signature précédée de "Lu et approuvé"</div>
        <p style="font-size: 8pt; margin-top: 10px;">Date : ___/___/______</p>
      </div>
      <div class="signature-box">
        <h4>Le Locataire</h4>
        <p style="font-size: 8pt;">Nom : {{LOCATAIRES_NOM_COMPLET}}</p>
        <div class="signature-line">Signature précédée de "Lu et approuvé"</div>
        <p style="font-size: 8pt; margin-top: 10px;">Date : ___/___/______</p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; font-size: 7pt; color: #999;">
      État des lieux généré le {{DATE_CREATION}} | Réf: {{EDL_REFERENCE}}
    </div>
  </div>
</body>
</html>
`;

export default EDL_TEMPLATE;

