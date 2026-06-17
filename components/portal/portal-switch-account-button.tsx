"use client";

import { signOut } from "next-auth/react";

export function PortalSwitchAccountButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
    >
      Sign out / Switch account
    </button>
  );
}
