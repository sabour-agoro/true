"use client";

import { useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";

export type HeroMotion = { x: number; y: number; progress: number };

function Ship({ motion }: { motion: RefObject<HeroMotion> }) {
  const ship = useRef<Group>(null);

  useFrame(() => {
    const node = ship.current;
    const live = motion.current;
    if (!node || !live) return;
    const dive = live.progress;
    node.position.x += (live.x * 2.4 - node.position.x) * 0.08;
    node.position.y += (live.y * 1.15 - 0.15 - node.position.y) * 0.08;
    node.position.z = 1.8 - dive * 4.4;
    node.rotation.z = -live.x * 0.55;
    node.rotation.x = 0.35 + live.y * 0.25;
    const scale = 1 - dive * 0.35;
    node.scale.setScalar(scale);
  });

  return (
    <group ref={ship} position={[0, -0.15, 1.8]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.15]}>
        <coneGeometry args={[0.16, 1.15, 4]} />
        <meshStandardMaterial color="#f4f1ea" metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, -0.28]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <boxGeometry args={[0.92, 0.08, 0.22]} />
        <meshStandardMaterial color="#161616" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.62]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#c9a24a" emissive="#c9a24a" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 0, 0.8]} color="#e6d3a1" intensity={6} distance={3.5} />
    </group>
  );
}

export function HeroCanvas({ motion }: { motion: RefObject<HeroMotion> }) {
  return (
    <Canvas
      className="absolute inset-0 z-[2] h-full w-full"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 15 }}
      camera={{ position: [0, 0, 7.2], fov: 38 }}
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 6]} intensity={1.4} />
      <Ship motion={motion} />
    </Canvas>
  );
}
