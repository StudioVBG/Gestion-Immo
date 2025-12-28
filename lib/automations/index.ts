/**
 * Module Automations
 * 
 * Fournit des fonctions pour automatiser les tâches récurrentes:
 * - Relances de loyers impayés
 * - Indexation IRL annuelle
 * - Alertes échéances (bail, assurance, diagnostics)
 * - Génération automatique des quittances
 * 
 * Ces fonctions sont conçues pour être appelées via:
 * - API Routes dédiées (déclenchées par Netlify, GitHub Actions, ou autre)
 * - Supabase Cron (pg_cron)
 */

export * from './rent-reminders';
export * from './irl-indexation';

// Types communs
export interface AutomationResult {
  success: boolean;
  processed: number;
  errors: string[];
  timestamp: string;
}

// Helper pour formater les résultats
export function formatAutomationResult(result: Partial<AutomationResult>): AutomationResult {
  return {
    success: result.success ?? true,
    processed: result.processed ?? 0,
    errors: result.errors ?? [],
    timestamp: new Date().toISOString(),
  };
}

