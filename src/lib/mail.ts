import nodemailer from "nodemailer";

const sender = process.env.MAIL_DEFAULT_SENDER || "noreply@uncommon-records.fr";

function transport() {
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  if (!user || !pass) return null; // SMTP not configured — soft-fail
  return nodemailer.createTransport({
    host: process.env.MAIL_SERVER || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  const t = transport();
  if (!t) return false;
  try {
    await t.sendMail({ from: sender, to, subject, html });
    return true;
  } catch (e) {
    console.error("Mail send failed:", e);
    return false;
  }
}

export function sendInviteEmail(email: string, link: string) {
  return send(
    email,
    "Invitation — Uncommon Records",
    `<p>Vous êtes invité·e à rejoindre Uncommon Records.</p>
     <p><a href="${link}">Créer votre compte</a></p>
     <p>Ce lien expire prochainement.</p>`,
  );
}

export function sendNewsletterSubscriptionEmail(email: string) {
  return send(
    sender,
    "Nouvelle inscription newsletter",
    `<p>Nouvelle inscription newsletter: ${email}</p>`,
  );
}
