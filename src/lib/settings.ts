import { prisma } from "@/lib/prisma";

// Settings an admin can change from /admin/settings without a redeploy.
//
// Each one has a default here, so an empty Setting table is a valid state
// and adding a key never needs a migration or a backfill. The naira rate
// keeps falling back to NEXT_PUBLIC_NGN_PER_USD so existing deployments
// behave exactly as before until someone edits it in the UI.

export type PlatformSettings = {
  supportEmail: string;
  ngnPerUsd: number;
};

export const SETTING_KEYS = {
  supportEmail: "support_email",
  ngnPerUsd: "ngn_per_usd",
} as const;

export const DEFAULT_SUPPORT_EMAIL = "support@cargoxo.com";

function envNgnRate(): number {
  const raw = process.env.NEXT_PUBLIC_NGN_PER_USD;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1600;
}

export async function getSettings(): Promise<PlatformSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [SETTING_KEYS.supportEmail, SETTING_KEYS.ngnPerUsd] } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const storedRate = Number(byKey.get(SETTING_KEYS.ngnPerUsd));

  return {
    supportEmail: byKey.get(SETTING_KEYS.supportEmail) || DEFAULT_SUPPORT_EMAIL,
    ngnPerUsd: Number.isFinite(storedRate) && storedRate > 0 ? storedRate : envNgnRate(),
  };
}
