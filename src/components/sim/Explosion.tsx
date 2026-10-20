import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { simClock } from "@/lib/simStore";
import { DESCENT, effects, type Weapon } from "@/lib/weapons";

const COUNT = 7000;

const cloudVert = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec4 aSeed; attribute float aType;
uniform float uT; uniform float uH; uniform float uPx; uniform float uCap; uniform float uS;
varying vec3 vCol; varying float vA;
void main(){
  float t = max(uT, 0.0);
  float rise = 1.0 - exp(-t / 3.5);
  float capY = uH * rise;
  float a = aSeed.x * 6.2831853 + t * 0.05 * (aSeed.w - 0.5);
  vec3 p; float heat; float size;
  if (aType < 0.5) { // stem
    float y = aSeed.y * capY;
    float r = (0.06 + 0.12 * aSeed.z) * uH * 0.25 * (0.6 + 0.6 * y / max(capY, 1e-4)) * (0.5 + rise);
    p = vec3(cos(a) * r, y, sin(a) * r);
    heat = exp(-t / 1.4) * (1.0 - aSeed.y * 0.5);
    size = 0.18 + 0.2 * aSeed.w;
  } else if (aType < 1.5) { // cap torus, rolling
    float R = (0.15 + 0.85 * rise) * uH * 0.32 * uCap + 0.05;
    float b = aSeed.z * 6.2831853 + t * 0.35;
    float rr = R * (0.25 + 0.45 * aSeed.y);
    p = vec3((R + rr * cos(b)) * cos(a), capY + rr * sin(b) * 0.65, (R + rr * cos(b)) * sin(a));
    heat = exp(-t / 2.2) * (0.6 + 0.4 * sin(b));
    size = 0.3 + 0.35 * aSeed.w;
  } else { // base surge / dust ring
    float grow = 1.0 - exp(-t / 2.5);
    float r = (0.2 + aSeed.y * 1.6) * grow * 1.4;
    p = vec3(cos(a) * r, aSeed.z * 0.12 * (1.0 + grow) , sin(a) * r);
    heat = exp(-t / 0.6) * 0.5;
    size = 0.2 + 0.25 * aSeed.w;
  }
  vec3 smoke = mix(vec3(0.35,0.3,0.27), vec3(0.62,0.57,0.52), aSeed.w);
  vec3 fire = mix(vec3(1.0,0.35,0.08), vec3(1.0,0.9,0.6), heat);
  vCol = mix(smoke, fire * 2.0, clamp(heat * 1.4, 0.0, 1.0));
  vA = smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(14.0, 21.0, t)) * (uT < 0.0 ? 0.0 : 1.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = size * uH * 0.3 * uS * uPx / max(-mv.z, 1e-6);
  #include <logdepthbuf_vertex>
}`;
const cloudFrag = /* glsl */ `
#include <logdepthbuf_pars_fragment>
varying vec3 vCol; varying float vA;
void main(){
  #include <logdepthbuf_fragment>
  vec2 c = gl_PointCoord - 0.5; float d = dot(c,c);
  if (d > 0.25) discard;
  float a = smoothstep(0.25, 0.0, d) * vA * 0.55;
  gl_FragColor = vec4(vCol, a);
}`;

const simpleVert = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal);
  vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz;
  gl_Position = projectionMatrix*viewMatrix*w;
  #include <logdepthbuf_vertex>
}`;
const flashFrag = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uO; varying vec3 vN; varying vec3 vW;
void main(){
  #include <logdepthbuf_fragment>
  float f = abs(dot(normalize(cameraPosition - vW), vN));
  vec3 col = mix(vec3(1.0,0.45,0.1), vec3(1.0,0.97,0.85), pow(f, 1.5));
  gl_FragColor = vec4(col * 2.5, uO * (0.4 + 0.6 * f));
}`;
const ringFrag = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uR; uniform float uO; varying vec2 vUv;
void main(){
  #include <logdepthbuf_fragment>
  float r = length(vUv - 0.5) * 2.0 * 6.0; // plane spans radius 6 units
  float band = exp(-pow((r - uR) * 9.0, 2.0)) + 0.35 * exp(-pow((r - uR*0.92) * 4.0, 2.0));
  float inner = smoothstep(uR, 0.0, r) * 0.08;
  gl_FragColor = vec4(vec3(1.0,0.85,0.65) * (band + inner), (band + inner) * uO);
}`;
const domeFrag = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uO; varying vec3 vN; varying vec3 vW;
void main(){
  #include <logdepthbuf_fragment>
  float f = 1.0 - abs(dot(normalize(cameraPosition - vW), vN));
  gl_FragColor = vec4(vec3(0.85,0.92,1.0), pow(f, 3.0) * uO);
}`;

function mat(frag: string, uniforms: Record<string, { value: number }>) {
  return new THREE.ShaderMaterial({
    vertexShader: simpleVert,
    fragmentShader: frag,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export function Explosion({
  weapon,
  S,
  position,
  showRings,
  ringColor,
}: {
  weapon: Weapon;
  S: number;
  position: THREE.Vector3;
  showRings: boolean;
  ringColor: string;
}) {
  const e = effects(weapon.yieldKt);
  const isNuke = weapon.kind !== "conventional";
  const fireRel = e.fireball / e.blast5;
  const thermalRel = e.thermal / e.blast5;
  const blast1Rel = e.blast1 / e.blast5;
  const H = isNuke ? THREE.MathUtils.clamp(e.cloudTop / e.blast5, 1.6, 5) : 0.9;

  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize()),
    [position],
  );

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(COUNT * 4);
    const types = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      for (let k = 0; k < 4; k++) seeds[i * 4 + k] = Math.random();
      const r = Math.random();
      types[i] = r < 0.3 ? 0 : r < 0.75 ? 1 : 2;
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    g.setAttribute("aType", new THREE.BufferAttribute(types, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 10);
    return g;
  }, []);

  const cloudMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cloudVert,
        fragmentShader: cloudFrag,
        uniforms: {
          uT: { value: -1 },
          uH: { value: H },
          uPx: { value: 800 },
          uCap: { value: isNuke ? 1 : 0.35 },
          uS: { value: S },
        },
        transparent: true,
        depthWrite: false,
      }),
    [H, isNuke, S],
  );
  const flashMat = useMemo(() => mat(flashFrag, { uO: { value: 0 } }), []);
  const ringMat = useMemo(() => mat(ringFrag, { uR: { value: 0 }, uO: { value: 0 } }), []);
  const domeMat = useMemo(() => mat(domeFrag, { uO: { value: 0 } }), []);

  const flashRef = useRef<THREE.Mesh>(null);
  const domeRef = useRef<THREE.Mesh>(null);
  const bombRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ size, gl }) => {
    const t = simClock.t;
    const tp = t < 0 ? -1 : t - DESCENT;
    cloudMat.uniforms["uT"]!.value = tp;
    cloudMat.uniforms["uPx"]!.value = size.height * gl.getPixelRatio() * 0.9;

    // bomb descent (bomb size exaggerated for visibility)
    if (bombRef.current) {
      const visible = t >= 0 && t < DESCENT;
      bombRef.current.visible = visible;
      const k = t / DESCENT;
      bombRef.current.position.y = 5 * (1 - k * k) + 0.05;
    }
    const f = flashRef.current!;
    if (tp >= 0) {
      const grow = 1 - Math.exp(-tp * 4);
      f.visible = tp < 6;
      f.scale.setScalar(Math.max(0.02, fireRel * 1.6 * grow + 0.02));
      flashMat.uniforms["uO"]!.value = Math.exp(-tp * 0.9);
      ringMat.uniforms["uR"]!.value = Math.min(6, tp * 0.85);
      ringMat.uniforms["uO"]!.value = Math.max(0, 1 - tp / 7);
      const d = domeRef.current!;
      d.visible = tp < 4;
      d.scale.setScalar(Math.max(0.01, tp * 0.9));
      domeMat.uniforms["uO"]!.value = Math.max(0, 1 - tp / 4) * 0.8;
      if (lightRef.current) lightRef.current.intensity = 40 * Math.exp(-tp * 1.5);
    } else {
      f.visible = false;
      if (domeRef.current) domeRef.current.visible = false;
      ringMat.uniforms["uO"]!.value = 0;
      if (lightRef.current) lightRef.current.intensity = 0;
    }
    if (ringsRef.current) ringsRef.current.visible = showRings && tp > 0.3;
  });

  return (
    <group position={position} quaternion={quat} scale={S}>
      {/* target marker */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004}>
        <ringGeometry args={[0.05, 0.09, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <group ref={bombRef} visible={false}>
        <mesh rotation-x={Math.PI}>
          <capsuleGeometry args={[0.03, 0.14, 6, 12]} />
          <meshStandardMaterial color="#555b60" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position-y={0.55}>
          <cylinderGeometry args={[0.004, 0.001, 0.9, 6]} />
          <meshBasicMaterial color="#cfd8dc" transparent opacity={0.35} />
        </mesh>
      </group>
      <mesh ref={flashRef} material={flashMat} position-y={0.1} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>
      <mesh ref={domeRef} material={domeMat} visible={false}>
        <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={ringMat} rotation-x={-Math.PI / 2} position-y={0.01}>
        <planeGeometry args={[12, 12]} />
      </mesh>
      <points geometry={geo} material={cloudMat} frustumCulled={false} />
      <pointLight ref={lightRef} position-y={0.6} color="#ffd9a0" distance={S * 10} decay={1} intensity={0} />
      <group ref={ringsRef} visible={false}>
        {[fireRel, 1, thermalRel, blast1Rel].map((r, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position-y={0.006}>
            <ringGeometry args={[r * 0.985, r, 128]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.75 - i * 0.12} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
