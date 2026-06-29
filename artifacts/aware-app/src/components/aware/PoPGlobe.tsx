import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";

interface PoPGlobeProps {
  size?: number;
  interactive?: boolean;
  className?: string;
  runIds?: string[];
  onMarkerClick?: (index: number) => void;
}

const DOT_COUNT = 600;
const ACTIVE_COUNT = 25;

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
  const col = new THREE.Color("#00c4ff"); // force bright blue
  for (let i = 0; i < DOT_COUNT; i++) {
    const b = 0.2 + Math.random() * 0.4;
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
      <pointsMaterial size={0.015} vertexColors sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

function ActiveDots({ onMarkerClick }: { onMarkerClick?: (index: number) => void }) {
  const ref = useRef<THREE.Points>(null);
  const hitRef = useRef(onMarkerClick);

  useEffect(() => {
    hitRef.current = onMarkerClick;
  });

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const mat = ref.current.material as THREE.PointsMaterial;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.0);
    mat.opacity = 0.6 + pulse * 0.4;
    mat.size = 0.04 + pulse * 0.02;
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
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute args={[ACTIVE_DOT_POSITIONS, 3]} attach="attributes-position" />
        </bufferGeometry>
        <pointsMaterial
          color="#33d4ff"
          size={0.05}
          sizeAttenuation
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {activePositions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          onClick={(e) => {
            e.stopPropagation();
            hitRef.current?.(i);
          }}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
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
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          color="#050608"
          emissive="#090d14"
          emissiveIntensity={0.5}
          shininess={50}
          specular="#00c4ff"
          transparent
          opacity={0.95}
        />
      </mesh>
      <StaticDots />
      <ActiveDots onMarkerClick={onMarkerClick} />
    </group>
  );
}

function PoPGlobeContent({
  size = 200,
  interactive = true,
  className,
  runIds: _runIds,
  onMarkerClick,
}: PoPGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cameraZ = 2.5 * (size / 200);
  return (
    <div ref={containerRef} className={className} style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,196,255,0.1)' }}>
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 45, near: 0.1, far: 10 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        frameloop={isVisible ? "always" : "demand"}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} color="#00c4ff" />
        <directionalLight position={[-3, -2, 4]} intensity={0.5} color="#00e5a0" />
        <GlobeGroup onMarkerClick={onMarkerClick} />
        {interactive && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />}
      </Canvas>
    </div>
  );
}

export default function PoPGlobe(props: PoPGlobeProps) {
  return (
    <PanelErrorBoundary label="Globe Viz">
      <PoPGlobeContent {...props} />
    </PanelErrorBoundary>
  );
}
