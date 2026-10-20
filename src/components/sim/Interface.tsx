import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { simClock, useSim, type View } from "@/lib/simStore";
import { DESCENT, SIM_TOTAL, WEAPONS, effects, fmtKm, phaseName, type Weapon } from "@/lib/weapons";

const KIND_LABEL: Record<Weapon["kind"], string> = {
  nuclear: "Fission",
  thermonuclear: "Thermonuclear",
  conventional: "Conventional",
};

function Tag({ type }: { type: "verified" | "approx" }) {
  return type === "verified" ? (
    <span className="rounded-sm border border-verified/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-verified">
      Historical record
    </span>
  ) : (
    <span className="rounded-sm border border-approx/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-approx">
      Approximation
    </span>
  );
}

function useClock() {
  const [t, setT] = useState(-1);
  useEffect(() => {
    const id = setInterval(() => setT(simClock.t), 100);
    return () => clearInterval(id);
  }, []);
  return t;
}

function Sidebar() {
  const { weaponId, compareId, selectWeapon, set } = useSim();
  const [filter, setFilter] = useState<"all" | Weapon["kind"]>("all");
  const list = WEAPONS.filter((w) => filter === "all" || w.kind === filter);
  return (
    <div className="glass flex h-full flex-col rounded-lg">
      <div className="border-b p-4">
        <div className="label-mono">Historical library</div>
        <div className="mt-3 flex flex-wrap gap-1">
          {(["all", "nuclear", "thermonuclear", "conventional"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : KIND_LABEL[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {list.map((w) => {
          const active = w.id === weaponId;
          const cmp = w.id === compareId;
          return (
            <div
              key={w.id}
              className={`group rounded-md border p-3 transition ${
                active ? "border-primary/60 bg-primary/10" : cmp ? "border-compare/60 bg-compare/10" : "border-transparent hover:bg-accent/60"
              }`}
            >
              <button onClick={() => selectWeapon(w.id)} className="w-full text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{w.name}</span>
                  <span className="font-mono text-[11px] text-primary">{w.yieldLabel.split(" (")[0]}</span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {w.era} · {w.country} · {w.date}
                </div>
              </button>
              {!active && (
                <button
                  onClick={() => set({ compareId: cmp ? null : w.id })}
                  className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${cmp ? "text-compare" : "text-muted-foreground hover:text-compare"}`}
                >
                  {cmp ? "✕ Remove comparison" : "+ Compare side-by-side"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "compare" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className={`font-mono text-xs ${tone === "compare" ? "text-compare" : "text-foreground"}`}>{v}</span>
    </div>
  );
}

function InfoPanel() {
  const { weaponId, compareId, target, exaggeration } = useSim();
  const t = useClock();
  const w = WEAPONS.find((x) => x.id === weaponId)!;
  const c = compareId ? WEAPONS.find((x) => x.id === compareId) : undefined;
  const e = effects(w.yieldKt);
  const ec = c ? effects(c.yieldKt) : null;
  const tp = t - DESCENT;
  const shockKm = tp > 0 ? Math.min(6, tp * 0.85) * e.blast5 : 0;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.5 });
  }, [weaponId]);

  return (
    <div ref={ref} className="glass flex h-full flex-col gap-4 overflow-y-auto rounded-lg p-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="label-mono">{KIND_LABEL[w.kind]} weapon</span>
          <Tag type="verified" />
        </div>
        <h2 className="mt-1 text-xl font-bold tracking-tight">{w.name}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{w.context}</p>
      </div>
      <div>
        <Stat k="Date" v={w.date} />
        <Stat k="Location" v={w.location} />
        <Stat k="Country" v={w.country} />
        <Stat k="Yield (TNT eq.)" v={w.yieldLabel} />
        <Stat k="Delivery" v={w.delivery} />
        <ul className="mt-3 space-y-1.5">
          {w.facts.map((f) => (
            <li key={f} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <span className="text-verified">▸</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="label-mono">Estimated effects</span>
          <Tag type="approx" />
        </div>
        <Stat k="Energy released" v={`${e.energyJ.toExponential(2)} J`} />
        <Stat k="Fireball radius" v={fmtKm(e.fireball)} />
        <Stat k="5 psi blast radius" v={fmtKm(e.blast5)} />
        <Stat k="1 psi blast radius" v={fmtKm(e.blast1)} />
        <Stat k="3rd-degree burn radius" v={fmtKm(e.thermal)} />
        {w.kind !== "conventional" && <Stat k="Cloud top altitude" v={fmtKm(e.cloudTop)} />}
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          Cube-root scaling laws for an idealized airburst. Real effects depend on burst height, terrain and weather.
          {w.kind === "conventional" && " Thermal/fireball figures are not meaningful for conventional explosives."}
        </p>
      </div>
      {c && ec && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label-mono text-compare">vs {c.name}</span>
            <Tag type="approx" />
          </div>
          <Stat k="Yield" v={c.yieldLabel} tone="compare" />
          <Stat k="Yield ratio" v={`${(w.yieldKt / c.yieldKt).toPrecision(3)}×`} tone="compare" />
          <Stat k="5 psi radius" v={fmtKm(ec.blast5)} tone="compare" />
          <Stat k="Blast area ratio" v={`${((e.blast5 / ec.blast5) ** 2).toPrecision(3)}×`} tone="compare" />
          <div className="mt-3 space-y-1">
            {[
              { n: w.name, v: e.blast5, cls: "bg-primary" },
              { n: c.name, v: ec.blast5, cls: "bg-compare" },
            ].map((b) => (
              <div key={b.n}>
                <div className="font-mono text-[10px] text-muted-foreground">{b.n}</div>
                <div className="h-1.5 rounded-full bg-secondary">
                  <div className={`h-full rounded-full ${b.cls}`} style={{ width: `${Math.max(2, (b.v / Math.max(e.blast5, ec.blast5)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="mb-1 label-mono">Live telemetry</div>
        <Stat k="Phase" v={phaseName(t)} />
        <Stat k="Time from impact" v={t < 0 ? "—" : `${tp >= 0 ? "+" : ""}${tp.toFixed(1)} s (sim)`} />
        <Stat k="Shock front (visual est.)" v={fmtKm(shockKm)} />
        <Stat k="Target" v={`${target.lat.toFixed(2)}°, ${target.lon.toFixed(2)}°`} />
        <Stat k="Visual exaggeration" v={`×${exaggeration}`} />
      </div>
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
        on ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Controls() {
  const s = useSim();
  const t = useClock();
  const views: { v: View; l: string }[] = [
    { v: "planet", l: "Planetary" },
    { v: "regional", l: "Regional" },
    { v: "ground", l: "Ground" },
  ];
  return (
    <div className="glass rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={s.launch}
          className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[0_0_24px_-4px_var(--primary)] transition hover:brightness-110"
        >
          {t < 0 ? "▶ Simulate" : "↻ Replay"}
        </button>
        <button
          disabled={!s.playing}
          onClick={() => s.set({ paused: !s.paused })}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        >
          {s.paused ? "Resume" : "Pause"}
        </button>
        <button onClick={s.reset} className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          Reset
        </button>
        <div className="flex min-w-[140px] flex-1 items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-[width] duration-100" style={{ width: `${Math.max(0, t / SIM_TOTAL) * 100}%` }} />
          </div>
          <span className="w-12 text-right font-mono text-[10px] text-muted-foreground">{Math.max(0, t).toFixed(1)}s</span>
        </div>
        <div className="flex gap-1">
          {views.map(({ v, l }) => (
            <Toggle key={v} on={s.view === v} onClick={() => s.set({ view: v, viewNonce: s.viewNonce + 1 })}>
              {l}
            </Toggle>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
        <label className="block">
          <span className="label-mono">Speed ×{s.speed.toFixed(2)}</span>
          <input type="range" min={0.1} max={4} step={0.05} value={s.speed} onChange={(e) => s.set({ speed: +e.target.value })} className="w-full" />
        </label>
        <label className="block">
          <span className="label-mono">Sun angle</span>
          <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={s.sunAngle} onChange={(e) => s.set({ sunAngle: +e.target.value })} className="w-full" />
        </label>
        <label className="block">
          <span className="label-mono">City lights</span>
          <input type="range" min={0} max={2} step={0.05} value={s.nightLights} onChange={(e) => s.set({ nightLights: +e.target.value })} className="w-full" />
        </label>
        <label className="block">
          <span className="label-mono">Visual scale ×{s.exaggeration}</span>
          <input type="range" min={1} max={60} step={1} value={s.exaggeration} onChange={(e) => s.set({ exaggeration: +e.target.value })} className="w-full" />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Toggle on={s.clouds} onClick={() => s.set({ clouds: !s.clouds })}>Clouds</Toggle>
        <Toggle on={s.atmosphere} onClick={() => s.set({ atmosphere: !s.atmosphere })}>Atmosphere</Toggle>
        <Toggle on={s.rings} onClick={() => s.set({ rings: !s.rings })}>Effect rings</Toggle>
        <Toggle on={s.autoRotate} onClick={() => s.set({ autoRotate: !s.autoRotate })}>Orbit cam</Toggle>
        <span className="ml-auto self-center font-mono text-[10px] text-muted-foreground">Click the globe to choose a target</span>
      </div>
    </div>
  );
}

export function Interface() {
  const [panel, setPanel] = useState<"none" | "lib" | "info">("none");
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col p-3 md:p-4">
      <header className="pointer-events-auto flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black tracking-tight md:text-xl">
            YIELD<span className="text-primary">/</span>ATLAS
          </h1>
          <p className="label-mono">Historical explosive yield simulator · educational</p>
        </div>
        <div className="flex gap-1 lg:hidden">
          <Toggle on={panel === "lib"} onClick={() => setPanel(panel === "lib" ? "none" : "lib")}>Library</Toggle>
          <Toggle on={panel === "info"} onClick={() => setPanel(panel === "info" ? "none" : "info")}>Data</Toggle>
        </div>
      </header>
      <div className="relative mt-3 flex min-h-0 flex-1 justify-between gap-4">
        <aside className={`pointer-events-auto w-full max-w-xs ${panel === "lib" ? "block" : "hidden"} lg:block`}>
          <Sidebar />
        </aside>
        <aside className={`pointer-events-auto ml-auto w-full max-w-sm ${panel === "info" ? "block" : "hidden"} lg:block`}>
          <InfoPanel />
        </aside>
      </div>
      <div className="pointer-events-auto mx-auto mt-3 w-full max-w-4xl">
        <Controls />
      </div>
    </div>
  );
}
