import { create } from "zustand";
import { WEAPONS, SIM_TOTAL } from "./weapons";

export type View = "planet" | "regional" | "ground";

/** Mutable sim clock read in useFrame (avoids React re-render per frame). t<0 = idle. */
export const simClock = { t: -1 };

interface SimState {
  weaponId: string;
  compareId: string | null;
  target: { lat: number; lon: number };
  playing: boolean;
  paused: boolean;
  speed: number;
  view: View;
  sunAngle: number;
  clouds: boolean;
  atmosphere: boolean;
  nightLights: number;
  rings: boolean;
  exaggeration: number;
  autoRotate: boolean;
  viewNonce: number;
  set: (p: Partial<SimState>) => void;
  launch: () => void;
  reset: () => void;
  selectWeapon: (id: string) => void;
}

export const useSim = create<SimState>((set, get) => ({
  weaponId: "little-boy",
  compareId: null,
  target: { lat: 34.3955, lon: 132.4536 },
  playing: false,
  paused: false,
  speed: 1,
  view: "planet",
  sunAngle: 0.4,
  clouds: true,
  atmosphere: true,
  nightLights: 1,
  rings: true,
  exaggeration: 10,
  autoRotate: false,
  viewNonce: 0,
  set: (p) => set(p),
  launch: () => {
    simClock.t = 0;
    const v = get().view === "planet" ? "regional" : get().view;
    set({ playing: true, paused: false, view: v, viewNonce: get().viewNonce + 1 });
  },
  reset: () => {
    simClock.t = -1;
    set({ playing: false, paused: false });
  },
  selectWeapon: (id) => {
    const w = WEAPONS.find((x) => x.id === id)!;
    simClock.t = -1;
    set({ weaponId: id, target: { lat: w.lat, lon: w.lon }, playing: false, paused: false, viewNonce: get().viewNonce + 1 });
  },
}));

export function tickClock(dt: number) {
  const s = useSim.getState();
  if (!s.playing || s.paused || simClock.t < 0) return;
  simClock.t = Math.min(SIM_TOTAL, simClock.t + dt * s.speed);
}
