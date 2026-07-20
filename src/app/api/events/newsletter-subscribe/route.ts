import { NextRequest } from "next/server";
import { json, error } from "@/lib/auth";
import { sendNewsletterSubscriptionEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}));
  const email = String(data.email || "").trim().toLowerCase();
  if (!email || !email.includes("@") || !email.split("@").pop()!.includes("."))
    return error("Adresse email invalide", 400);

  const sent = await sendNewsletterSubscriptionEmail(email);
  if (!sent) return error("Impossible de traiter l'inscription pour le moment", 503);
  return json({ message: "Inscription newsletter prise en compte" });
}
