import { NextRequest, NextResponse } from "next/server";

// Route API pour l'envoi d'emails
// TODO: Intégrer un service d'email (Resend, SendGrid, etc.)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    // TODO: Implémenter l'envoi réel d'email
    // Exemple avec Resend:
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@votre-domaine.com',
    //   to: to,
    //   subject: subject,
    //   html: html,
    // });

    // Pour l'instant, on log juste
    console.log("Email would be sent:", { to, subject });

    return NextResponse.json({ success: true, message: "Email sent (mocked)" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

