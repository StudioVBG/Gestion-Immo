// Service pour l'envoi d'emails
// Note: Peut utiliser Resend, SendGrid, ou Supabase Edge Functions

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  async sendEmail(data: EmailData) {
    // TODO: Implémenter l'envoi d'email via une API (Resend, SendGrid, etc.)
    // Pour l'instant, on log juste l'email
    console.log("Email would be sent:", data);

    // Exemple avec une API route Next.js
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  async sendInvoiceNotification(invoiceId: string, tenantEmail: string) {
    const subject = "Nouvelle facture disponible";
    const html = `
      <h1>Nouvelle facture disponible</h1>
      <p>Une nouvelle facture est disponible dans votre espace locataire.</p>
      <p>Connectez-vous pour consulter et payer votre facture.</p>
    `;

    return this.sendEmail({
      to: tenantEmail,
      subject,
      html,
    });
  }

  async sendPaymentConfirmation(paymentId: string, tenantEmail: string, amount: number) {
    const subject = "Confirmation de paiement";
    const html = `
      <h1>Paiement confirmé</h1>
      <p>Votre paiement de ${amount}€ a été confirmé avec succès.</p>
      <p>Merci pour votre paiement.</p>
    `;

    return this.sendEmail({
      to: tenantEmail,
      subject,
      html,
    });
  }

  async sendTicketNotification(ticketId: string, ownerEmail: string, ticketTitle: string) {
    const subject = "Nouveau ticket de maintenance";
    const html = `
      <h1>Nouveau ticket de maintenance</h1>
      <p>Un nouveau ticket a été créé : ${ticketTitle}</p>
      <p>Connectez-vous pour consulter et gérer le ticket.</p>
    `;

    return this.sendEmail({
      to: ownerEmail,
      subject,
      html,
    });
  }

  async sendLeaseSignatureRequest(leaseId: string, signerEmail: string, signerName: string) {
    const subject = "Demande de signature de bail";
    const html = `
      <h1>Signature de bail requise</h1>
      <p>Bonjour ${signerName},</p>
      <p>Vous devez signer un bail. Connectez-vous pour consulter et signer le document.</p>
    `;

    return this.sendEmail({
      to: signerEmail,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();

