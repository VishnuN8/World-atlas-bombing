import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { OrbitControls as OC } from "three-stdlib";
import { Earth } from "./Earth";
import { Explosion } from "./Explosion";
import { tickClock, useSim } from "@/lib/simStore";
import { WEAPONS, effects, latLonToVec, R_EARTH_KM } from "@/lib/weapons";

export function scaleFor(yieldKt: number, ex: number) {
  return (effects(yieldKt).blast5 / R_EARTH_KM) * ex;
}

function Sun() {
  const ref = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const a = useSim.getState().sunAngle;
    ref.current?.position.set(Math.cos(a) * 10, 2.5, Math.sin(a) * 10);
  });
  return <directionalLight ref={ref} intensity={2.6} color="#fff6e8" />;
}

function Clock() {
  useFrame((_, d) => tickClock(Math.min(d, 0.05)));
  return null;
}

function CameraRig({ focusS }: { focusS: number }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OC | null };
  const { view, target, viewNonce } = useSim();
  useEffect(() => {
    if (!controls) return;
    const n = new THREE.Vector3(...latLonToVec(target.lat, target.lon)).normalize();
    const east = new THREE.Vector3(0, 1, 0).cross(n).normalize();
    if (east.lengthSq() < 1e-6) east.set(1, 0, 0);
    const north = n.clone().cross(east).normalize();
    let pos: THREE.Vector3, tgt: THREE.Vector3;
    if (view === "planet") {
      pos = n.clone().multiplyScalar(3.2).addScaledVector(north, -0.6);
      tgt = new THREE.Vector3();
      controls.minDistance = 1.15;
    } else if (view === "regional") {
      const d = Math.max(focusS * 9, 0.004);
      tgt = n.clone().multiplyScalar(1 + focusS * 1.2);
      pos = tgt.clone().addScaledVector(n, d * 0.75).addScaledVector(north, -d * 0.75);
      controls.minDistance = focusS * 0.5;
    } else {
      tgt = n.clone().multiplyScalar(1 + focusS * 2.4);
      pos = n.clone().multiplyScalar(1 + focusS * 0.6).addScaledVector(north, -focusS * 8.5);
      controls.minDistance = focusS * 0.2;
    }
    camera.near = view === "planet" ? 0.01 : Math.max(focusS * 0.01, 1e-6);
    camera.updateProjectionMatrix();
    const tl = gsap.timeline({ onUpdate: () => controls.update() });
    tl.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 2.2, ease: "power3.inOut" }, 0);
    tl.to(controls.target, { x: tgt.x, y: tgt.y, z: tgt.z, duration: 2.2, ease: "power3.inOut" }, 0);
    return () => {
      tl.kill();
    };
  }, [view, target.lat, target.lon, viewNonce, controls, camera, focusS]);
  return null;
}

function World() {
  const { weaponId, compareId, target, exaggeration, rings, autoRotate, view } = useSim();
  const w = WEAPONS.find((x) => x.id === weaponId)!;
  const c = compareId ? WEAPONS.find((x) => x.id === compareId) : undefined;
  const S = scaleFor(w.yieldKt, exaggeration);
  const S2 = c ? scaleFor(c.yieldKt, exaggeration) : 0;
  const focusS = Math.max(S, S2);

  const posA = useMemo(() => new THREE.Vector3(...latLonToVec(target.lat, target.lon, 1)), [target]);
  const posB = useMemo(() => {
    if (!c) return posA;
    const n = posA.clone().normalize();
    const east = new THREE.Vector3(0, 1, 0).cross(n).normalize();
    const off = (S + S2) * 2.6;
    return n.addScaledVector(east, off).normalize();
  }, [c, posA, S, S2]);
  const posA2 = useMemo(() => {
    if (!c) return posA;
    const n = posA.clone().normalize();
    const east = new THREE.Vector3(0, 1, 0).cross(n).normalize();
    return n.addScaledVector(east, -(S + S2) * 0.4).normalize();
  }, [c, posA, S, S2]);

  return (
    <>
      <CameraRig focusS={focusS} />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={view === "planet" ? 0.5 : 0.35}
        zoomSpeed={0.9}
        maxDistance={9}
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
      />
      <Explosion key={w.id + exaggeration} weapon={w} S={S} position={posA2} showRings={rings} ringColor="#ffb347" />
      {c && (
        <Explosion key={"c" + c.id + exaggeration} weapon={c} S={S2} position={posB} showRings={rings} ringColor="#6fd3ff" />
      )}
    </>
  );
}

export function SimCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, logarithmicDepthBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ position: [0, 1, 3.4], fov: 45, near: 0.01, far: 200 }}
    >
      <color attach="background" args={["#03050a"]} />
      <ambientLight intensity={0.04} />
      <Sun />
      <Clock />
      <Stars radius={80} depth={40} count={4000} factor={3} fade speed={0.3} />
      <Suspense fallback={null}>
        <Earth />
        <World />
      </Suspense>
    </Canvas>
  );
}
