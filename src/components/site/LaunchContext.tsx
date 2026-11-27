"use client";

import { createContext, useContext } from "react";

/** L'état du lancement, tel que les composants du navigateur le lisent (voir lib/launch.ts, lu une fois par le gabarit du site). */
export type LaunchState = { open: boolean; when: string; waitlist: boolean };
const Ctx = createContext<LaunchState>({ open: true, when: "", waitlist: false });

export function LaunchProvider({ value, children }: { value: LaunchState; children: React.ReactNode }) {
  return <Ctx value={value}>{children}</Ctx>;
}

export function useLaunch(): LaunchState {
  return useContext(Ctx);
}
