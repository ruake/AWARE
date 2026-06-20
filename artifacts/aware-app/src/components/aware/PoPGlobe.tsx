import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function cssVar(name: string): string {
  if (typeof document === "undefined") return "#3b82f6";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#3b82f6";
}

const BLUE_BRIGHT = () => cssVar("--proof-blue-bright");
const BLUE = () => cssVar("--proof-blue");
const SURFACE = () => cssVar("--proof-surface");
const BG = () => cssVar("--proof-bg");

interface PoPGlobeProps {
  size?: number;
  interactive?: boolean;
  className?: string;
  runIds?: string[];
  onMarkerClick?: (index: number) => void;
}

const DOT_COUNT = 300;
const ACTIVE_COUNT = 15;

function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lng * (Math.PI / 180);
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

const DOT_POSITIONS = (() => {
  const p = new Float32Array(DOT_COUNT * 3);
  for (let i = 0; i < DOT_COUNT; i++) {
    const lat = Math.random() * 180 - 90;
    const lng = Math.random() * 360 - 180;
    [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]] = latLngToXYZ(lat, lng, 1.01);
  }
  return p;
})();

const DOT_COLORS = (() => {
  const c = new Float32Array(DOT_COUNT * 3);
  const col = new THREE.Color(BLUE_BRIGHT());
  for (let i = 0; i < DOT_COUNT; i++) {
    const b = 0.4 + Math.random() * 0.6;
    c[i * 3] = col.r * b;
    c[i * 3 + 1] = col.g * b;
    c[i * 3 + 2] = col.b * b;
  }
  return c;
})();

const ACTIVE_DOT_POSITIONS = (() => {
  const p = new Float32Array(ACTIVE_COUNT * 3);
  for (let i = 0; i < ACTIVE_COUNT; i++) {
    const lat = Math.random() * 180 - 90;
    const lng = Math.random() * 360 - 180;
    [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]] = latLngToXYZ(lat, lng, 1.015);
  }
  return p;
})();

function StaticDots() {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute args={[DOT_POSITIONS, 3]} attach="attributes-position" />
        <bufferAttribute args={[DOT_COLORS, 3]} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial size={0.025} vertexColors sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

function ActiveDots({ onMarkerClick }: { onMarkerClick?: (index: number) => void }) {
  const ref = useRef<THREE.Points>(null);
  const hitRef = useRef(onMarkerClick);

  React.useEffect(() => {
    hitRef.current = onMarkerClick;
  });

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const mat = ref.current.material as THREE.PointsMaterial;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
    mat.opacity = 0.5 + pulse * 0.5;
    mat.size = 0.03 + pulse * 0.025;
  });

  const activePositions: [number, number, number][] = [];
  for (let i = 0; i < ACTIVE_COUNT; i++) {
    activePositions.push([
      ACTIVE_DOT_POSITIONS[i * 3],
      ACTIVE_DOT_POSITIONS[i * 3 + 1],
      ACTIVE_DOT_POSITIONS[i * 3 + 2],
    ]);
  }

  return (
    <group>
      {/* Visual pulsing dots */}
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute args={[ACTIVE_DOT_POSITIONS, 3]} attach="attributes-position" />
        </bufferGeometry>
        <pointsMaterial color={BLUE_BRIGHT()} size={0.04} sizeAttenuation transparent opacity={0.8} />
      </points>
      {/* Invisible clickable spheres over active dots */}
      {activePositions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          onClick={(e) => {
            e.stopPropagation();
            hitRef.current?.(i);
          }}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function GlobeGroup({ onMarkerClick }: { onMarkerClick?: (index: number) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhongMaterial
          color={SURFACE()}
          emissive={BG()}
          emissiveIntensity={0.25}
          shininess={15}
          specular={BLUE()}
        />
      </mesh>
      <StaticDots />
      <ActiveDots onMarkerClick={onMarkerClick} />
    </group>
  );
}

export default function PoPGlobe({
  size = 200,
  interactive = true,
  className,
  runIds: _runIds,
  onMarkerClick,
}: PoPGlobeProps) {
  const cameraZ = 2.5 * (size / 200);
  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 45, near: 0.1, far: 10 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 3, 5]} intensity={0.9} />
        <directionalLight position={[-3, -2, 4]} intensity={0.3} />
        <GlobeGroup onMarkerClick={onMarkerClick} />
        {interactive && <OrbitControls enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}
