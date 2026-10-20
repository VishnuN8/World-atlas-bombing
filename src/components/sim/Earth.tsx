import { useTexture } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simStore";
import { vecToLatLon } from "@/lib/weapons";

const atmoVert = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vN; varying vec3 vW;
void main(){
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  #include <logdepthbuf_vertex>
}`;
const atmoFrag = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
void main(){
  #include <logdepthbuf_fragment>
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(1.0 - abs(dot(V, vN)), 2.6);
  float day = smoothstep(-0.35, 0.5, dot(vN, uSun));
  // Rayleigh-like tint: blue on the day limb, warm at the terminator
  float term = exp(-pow(dot(vN, uSun) * 4.0, 2.0));
  vec3 col = mix(vec3(0.25,0.55,1.0), vec3(1.0,0.55,0.3), term*0.6);
  gl_FragColor = vec4(col * rim * (0.08 + 1.6*day), rim * (0.1 + day));
}`;

export function Earth() {
  type T = THREE.Texture;
  const [day, normal, spec, lights, clouds] = useTexture([
    "/textures/earth_atmos_2048.jpg",
    "/textures/earth_normal_2048.jpg",
    "/textures/earth_specular_2048.jpg",
    "/textures/earth_lights_2048.png",
    "/textures/earth_clouds_1024.png",
  ]) as unknown as [T, T, T, T, T];
  day.colorSpace = THREE.SRGBColorSpace;
  lights.colorSpace = THREE.SRGBColorSpace;
  day.anisotropy = 8;

  const { clouds: showClouds, atmosphere, nightLights, set } = useSim();
  const cloudRef = useRef<THREE.Mesh>(null);

  const earthMat = useMemo(() => {
    const m = new THREE.MeshPhongMaterial({
      map: day,
      normalMap: normal,
      normalScale: new THREE.Vector2(1.4, 1.4),
      specularMap: spec,
      specular: new THREE.Color(0x335577),
      shininess: 18,
      emissiveMap: lights,
      emissive: new THREE.Color(1, 0.85, 0.55),
    });
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        #if NUM_DIR_LIGHTS > 0
          float nd = dot(normalize(vNormal), directionalLights[0].direction);
          totalEmissiveRadiance *= smoothstep(0.12, -0.25, nd);
        #endif`,
      );
    };
    return m;
  }, [day, normal, spec, lights]);
  earthMat.emissiveIntensity = nightLights * 1.6;

  const sunDir = useMemo(() => new THREE.Vector3(), []);
  const atmoMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmoVert,
        fragmentShader: atmoFrag,
        uniforms: { uSun: { value: sunDir } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [sunDir],
  );
  const haloMat = useMemo(() => {
    const m = atmoMat.clone();
    m.side = THREE.FrontSide;
    m.uniforms = { uSun: { value: sunDir } };
    return m;
  }, [atmoMat, sunDir]);

  useFrame((_, dt) => {
    const a = useSim.getState().sunAngle;
    sunDir.set(Math.cos(a), 0.25, Math.sin(a)).normalize();
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.004;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return; // ignore drags
    e.stopPropagation();
    const p = e.point;
    set({ target: vecToLatLon(p.x, p.y, p.z) });
  };

  return (
    <group>
      <mesh material={earthMat} onClick={onClick}>
        <sphereGeometry args={[1, 256, 256]} />
      </mesh>
      {showClouds && (
        <mesh ref={cloudRef} scale={1.006}>
          <sphereGeometry args={[1, 128, 128]} />
          <meshPhongMaterial map={clouds} alphaMap={clouds} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
      {atmosphere && (
        <>
          <mesh material={atmoMat} scale={1.06}>
            <sphereGeometry args={[1, 96, 96]} />
          </mesh>
          <mesh material={haloMat} scale={1.008}>
            <sphereGeometry args={[1, 96, 96]} />
          </mesh>
        </>
      )}
    </group>
  );
}
