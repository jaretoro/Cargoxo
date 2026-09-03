// Cargoxo has no email provider wired up yet (see the Known gaps section of
// the README — nobody is notified of anything). Password reset is the first
// flow that genuinely cannot work without delivery, so this is the seam a
// real provider slots into.
//
// Until one is configured, mail is written to the server log. That keeps the
// flow testable locally without ever putting a reset link somewhere a
// visitor could read it — showing the link in the browser would let anyone
// reset anyone's password.

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

  // Deliberately not implemented rather than half-implemented: wire up your
  // provider here (Resend, Postmark, nodemailer over SMTP_URL, …). Throwing
  // is safer than silently dropping mail once EMAIL_FROM/SMTP_URL are set,
  // because a silent failure would look like a working reset flow.
  throw new Error(
    "SMTP_URL and EMAIL_FROM are set but no mail transport is implemented in src/lib/mail.ts. Add one, or unset them to fall back to logging.",
  );
}
