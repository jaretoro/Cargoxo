// Cargoxo has no email provider wired up yet (see the Known gaps section of
// the README — nobody is notified of anything). Password reset is the first
// flow that genuinely cannot work without delivery, so this is the seam a
// real provider slots into.
//
// Until one is configured, mail is written to the server log. That keeps the
// flow testable locally without ever putting a reset link somewhere a
// visitor could read it — showing the link in the browser would let anyone
// reset anyone's password.

import nodemailer, { type Transporter } from "nodemailer";

export type Mail = {
  to: string;
  subject: string;
  text: string;
};

export function isMailConfigured(): boolean {
  return Boolean(process.env.EMAIL_FROM && process.env.SMTP_URL);
}

export async function sendMail(mail: Mail): Promise<void> {
  if (!isMailConfigured()) {
    console.log(
      [
        "",
        "──────────── EMAIL (not sent — no provider configured) ────────────",
        `To:      ${mail.to}`,
        `Subject: ${mail.subject}`,
        "",
        mail.text,
        "───────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  // Any provider that speaks SMTP works (Resend, Postmark, Brevo, SES, …):
  // SMTP_URL is e.g. "smtps://user:pass@smtp.example.com:465". A failure
  // propagates rather than being swallowed, so a misconfigured provider
  // shows up as an error instead of a reset flow that silently does nothing.
  await getTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
  });
}

let transport: Transporter | undefined;

function getTransport(): Transporter {
  transport ??= nodemailer.createTransport(process.env.SMTP_URL);
  return transport;
}
