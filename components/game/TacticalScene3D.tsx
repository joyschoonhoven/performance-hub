"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import type { Group, Mesh } from "three";

export interface SceneP { id: number; team: "blue" | "red"; x: number; y: number; number: number; highlighted?: boolean }
export interface SceneBall { x: number; y: number }

interface Props {
  players: SceneP[];
  ball: SceneBall;
  height?: number;
}

/**
 * 3D pitch + low-poly players.
 * - Camera at low angle behind blue team
 * - Players are cylinders + sphere heads (mobile-game style)
 * - Highlighted players have a glowing gold ring + slight float bob
 * - Ball rotates and bobs subtly
 */
export function TacticalScene3D({ players, ball, height = 460 }: Props) {
  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      <Canvas
        shadows
        camera={{ position: [0, 28, 32], fov: 36, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneContents players={players} ball={ball} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function SceneContents({ players, ball }: { players: SceneP[]; ball: SceneBall }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[18, 30, 18]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-15, 20, -10]} intensity={0.4} color="#4DAEE5" />
      <pointLight position={[0, 12, 0]} intensity={0.5} color="#F0A500" distance={40} />

      {/* Subtle environment for reflections on the ball */}
      <Environment preset="night" background={false} />

      {/* The pitch */}
      <Pitch />

      {/* Players */}
      {players.map((p) => (
        <Player3D key={p.id} player={p} />
      ))}

      {/* Ball */}
      <Ball3D ball={ball} />

      {/* Contact shadows under everything */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={70}
        blur={2.4}
        far={20}
      />

      {/* Subtle camera rotation — slow, calm */}
      <CameraOrbit />

      {/* OrbitControls disabled by default — gives a fixed cinematic angle */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </>
  );
}

/* ───────────────────────── PITCH ───────────────────────── */

function Pitch() {
  // Pitch dimensions in scene units
  const PW = 32;   // half-width
  const PL = 48;   // half-length

  // Texture-less aesthetic green using mesh material
  const grassMat = useMemo(() => ({
    color: "#1F4A2C",
    roughness: 0.85,
    metalness: 0.05,
  }), []);

  return (
    <group>
      {/* Main grass */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[PW, PL]} />
        <meshStandardMaterial {...grassMat} />
      </mesh>

      {/* Slightly lighter centre band for "mowed stripe" effect */}
      {Array.from({ length: 8 }).map((_, i) => {
        const z = -PL / 2 + (i + 0.5) * (PL / 8);
        const stripe = i % 2 === 0 ? "#22532F" : "#1B4226";
        return (
          <mesh
            key={i}
            rotation-x={-Math.PI / 2}
            position={[0, 0.005, z]}
          >
            <planeGeometry args={[PW, PL / 8]} />
            <meshStandardMaterial color={stripe} roughness={0.9} />
          </mesh>
        );
      })}

      {/* White pitch lines (using flat thin boxes) */}
      <PitchLines PW={PW} PL={PL} />

      {/* Goals */}
      <Goal z={-PL / 2} />
      <Goal z={PL / 2} flipped />
    </group>
  );
}

function PitchLines({ PW, PL }: { PW: number; PL: number }) {
  const lineMat = { color: "#ffffff", roughness: 0.6, metalness: 0.1, transparent: true, opacity: 0.85 };
  const T = 0.06; // line thickness
  const Y = 0.02; // hover above grass

  return (
    <group>
      {/* Outer rectangle */}
      <mesh position={[0, Y, -PL / 2]}><boxGeometry args={[PW, T, 0.15]} /><meshStandardMaterial {...lineMat} /></mesh>
      <mesh position={[0, Y, PL / 2]}><boxGeometry args={[PW, T, 0.15]} /><meshStandardMaterial {...lineMat} /></mesh>
      <mesh position={[-PW / 2, Y, 0]}><boxGeometry args={[0.15, T, PL]} /><meshStandardMaterial {...lineMat} /></mesh>
      <mesh position={[PW / 2, Y, 0]}><boxGeometry args={[0.15, T, PL]} /><meshStandardMaterial {...lineMat} /></mesh>

      {/* Halfway line */}
      <mesh position={[0, Y, 0]}><boxGeometry args={[PW, T, 0.15]} /><meshStandardMaterial {...lineMat} /></mesh>

      {/* Centre circle (made from a ring) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, Y, 0]}>
        <ringGeometry args={[4.4, 4.55, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} side={2} />
      </mesh>

      {/* Centre spot */}
      <mesh rotation-x={-Math.PI / 2} position={[0, Y + 0.01, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Penalty areas */}
      {[1, -1].map((dir) => (
        <group key={dir} position={[0, 0, (PL / 2) * dir]}>
          <mesh position={[0, Y, -8 * dir]}>
            <boxGeometry args={[16, T, 0.15]} />
            <meshStandardMaterial {...lineMat} />
          </mesh>
          <mesh position={[-8, Y, -4 * dir]}>
            <boxGeometry args={[0.15, T, 8]} />
            <meshStandardMaterial {...lineMat} />
          </mesh>
          <mesh position={[8, Y, -4 * dir]}>
            <boxGeometry args={[0.15, T, 8]} />
            <meshStandardMaterial {...lineMat} />
          </mesh>
          {/* 6-yard box */}
          <mesh position={[0, Y, -3 * dir]}>
            <boxGeometry args={[8, T, 0.12]} />
            <meshStandardMaterial {...lineMat} />
          </mesh>
          <mesh position={[-4, Y, -1.5 * dir]}>
            <boxGeometry args={[0.12, T, 3]} />
            <meshStandardMaterial {...lineMat} />
          </mesh>
          <mesh position={[4, Y, -1.5 * dir]}>
            <boxGeometry args={[0.12, T, 3]} />
            <meshStandardMaterial {...lineMat} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Goal({ z, flipped }: { z: number; flipped?: boolean }) {
  const offset = flipped ? 0.4 : -0.4;
  return (
    <group position={[0, 0, z + offset]}>
      {/* Posts */}
      <mesh castShadow position={[-3.6, 1.2, 0]}><cylinderGeometry args={[0.08, 0.08, 2.4, 12]} /><meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} /></mesh>
      <mesh castShadow position={[3.6, 1.2, 0]}><cylinderGeometry args={[0.08, 0.08, 2.4, 12]} /><meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} /></mesh>
      {/* Crossbar */}
      <mesh castShadow position={[0, 2.4, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.08, 0.08, 7.2, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Net (translucent dark grey) */}
      <mesh position={[0, 1.2, flipped ? 0.6 : -0.6]}>
        <boxGeometry args={[7.2, 2.4, 1.2]} />
        <meshStandardMaterial color="#0D1B2A" transparent opacity={0.12} wireframe />
      </mesh>
    </group>
  );
}

/* ───────────────────────── PLAYER ───────────────────────── */

function Player3D({ player }: { player: SceneP }) {
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);

  // Scene coords (centered, blue at +z, red at -z)
  const sx = (player.x - 0.5) * 32;        // -16..+16
  const sz = (player.y - 0.5) * 48;        //  -24..+24 (no flip — y=0 (top) is far side)

  const teamColor = player.team === "blue" ? "#1B6CA8" : "#D64045";
  const jerseyColor = player.team === "blue" ? "#2C8FD4" : "#E55C61";

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    if (player.highlighted) {
      // Bob the highlighted players gently
      const phase = player.id * 0.7;
      groupRef.current.position.y = Math.abs(Math.sin(t * 1.6 + phase)) * 0.2;
      groupRef.current.rotation.y = Math.sin(t * 0.8 + phase) * 0.18;
    } else {
      // Subtle sway for everyone else
      const phase = player.id * 0.4;
      groupRef.current.rotation.y = Math.sin(t * 0.35 + phase) * 0.08;
    }
    if (ringRef.current) {
      const t2 = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t2 * 2.2 + player.id) * 0.12;
      ringRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <group ref={groupRef} position={[sx, 0, sz]}>
      {/* Body — cylinder */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 1.2, 14]} />
        <meshStandardMaterial color={teamColor} roughness={0.55} />
      </mesh>

      {/* Jersey accent — slightly lighter top half */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.33, 0.34, 0.6, 14]} />
        <meshStandardMaterial color={jerseyColor} roughness={0.5} />
      </mesh>

      {/* Head — sphere */}
      <mesh castShadow position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.26, 16, 14]} />
        <meshStandardMaterial color="#E8C5A0" roughness={0.6} />
      </mesh>

      {/* Number on chest */}
      <mesh position={[0, 1.0, 0.34]}>
        <planeGeometry args={[0.35, 0.3]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.0} />
      </mesh>

      {/* Highlight ring under highlighted players */}
      {player.highlighted && (
        <>
          <mesh ref={ringRef} rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
            <ringGeometry args={[0.55, 0.75, 32]} />
            <meshStandardMaterial color="#F0A500" emissive="#F0A500" emissiveIntensity={1.6} transparent opacity={0.85} side={2} />
          </mesh>
          <pointLight position={[0, 0.4, 0]} intensity={1.4} color="#F0A500" distance={3} decay={2} />
        </>
      )}
    </group>
  );
}

/* ───────────────────────── BALL ───────────────────────── */

function Ball3D({ ball }: { ball: SceneBall }) {
  const ballRef = useRef<Mesh>(null);
  const bx = (ball.x - 0.5) * 32;
  const bz = (ball.y - 0.5) * 48;

  useFrame((state) => {
    if (!ballRef.current) return;
    const t = state.clock.elapsedTime;
    ballRef.current.rotation.y = t * 1.4;
    ballRef.current.rotation.x = t * 0.9;
    ballRef.current.position.y = 0.32 + Math.abs(Math.sin(t * 2.4)) * 0.05;
  });

  return (
    <mesh ref={ballRef} castShadow position={[bx, 0.32, bz]}>
      <sphereGeometry args={[0.3, 24, 20]} />
      <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.05} />
    </mesh>
  );
}

/* ───────────────────────── CAMERA ───────────────────────── */

function CameraOrbit() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Very slow horizontal sway — like a stadium camera
    const radius = 32;
    const x = Math.sin(t * 0.05) * 3;
    state.camera.position.x = x;
    state.camera.position.y = 26;
    state.camera.position.z = radius;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}
