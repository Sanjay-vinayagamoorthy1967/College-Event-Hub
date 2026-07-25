import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Stars, Sparkles, Grid, useDepthBuffer, SpotLight } from '@react-three/drei';
import * as THREE from 'three';

// 1. Trophy (Centered, Slow Rotation, Rim-Lit)
function GoldenTrophy({ introPhase, flashIgnition }) {
  const trophyRef = useRef();
  
  useFrame((state, delta) => {
    if (trophyRef.current) {
      trophyRef.current.rotation.y -= delta * (Math.PI * 2 / 25);
    }
  });

  const goldMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#F9D423',
    emissive: '#4A3B00',
    emissiveIntensity: 0.1,
    roughness: 0.15,
    metalness: 1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  }), []);

  const accentMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#B8860B',
    roughness: 0.3,
    metalness: 0.9,
  }), []);

  return (
    <group ref={trophyRef} position={[0, -0.5, 0]} scale={1.2}>
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.5, 0.3, 2, 64, 1, false]} />
        <primitive object={goldMaterial} attach="material" />
      </mesh>
      <mesh receiveShadow position={[0, 1.51, 0]}>
        <cylinderGeometry args={[1.4, 0.25, 2, 64, 1, true]} />
        <meshPhysicalMaterial color="#332200" roughness={0.5} metalness={0.8} side={THREE.BackSide} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.1, 32, 64]} />
        <primitive object={goldMaterial} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 1, 32]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.6, 0]}>
        <cylinderGeometry args={[1.2, 1.5, 0.4, 64]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.9, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.2, 64]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>
      <group position={[0, 1.2, 0]}>
        <mesh castShadow receiveShadow position={[-1.1, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <torusGeometry args={[0.8, 0.08, 16, 64, Math.PI * 1.2]} />
          <primitive object={goldMaterial} attach="material" />
        </mesh>
        <mesh castShadow receiveShadow position={[1.1, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
          <torusGeometry args={[0.8, 0.08, 16, 64, -Math.PI * 1.2]} />
          <primitive object={goldMaterial} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

// 2 & 3. Stage / Holographic Floor Grid
function TechStage({ flashIgnition }) {
  const ringRef = useRef();

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group position={[0, -1.8, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[3.5, 3.8, 0.2, 64]} />
        <meshPhysicalMaterial 
          color="#03060f" 
          transmission={0.4} 
          opacity={0.8} 
          transparent 
          roughness={0.2} 
          metalness={0.9}
        />
        <mesh position={[0, 0.05, 0]}>
          <ringGeometry args={[3.45, 3.5, 64]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} rotation={[-Math.PI/2, 0, 0]} />
        </mesh>
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.5, 0]}>
        <torusGeometry args={[5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={flashIgnition > 0 ? 0.8 : 0.4} />
      </mesh>
    </group>
  );
}

function HolographicGrid() {
  const gridRef = useRef();

  useFrame((state, delta) => {
    if (gridRef.current) {
      // Slow scrolling effect by shifting texture offset
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <group position={[0, -2.5, -10]}>
      <Grid 
        ref={gridRef}
        args={[40, 40]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#00f0ff" 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#00f0ff" 
        fadeDistance={25} 
        fadeStrength={1} 
        transparent 
        opacity={0.15} 
      />
    </group>
  );
}

// 5 & 8. Trophy Contrast Lighting + Signature Entrance Flash
function TechLighting({ flashIgnition }) {
  const keyLightRef = useRef();
  const rimLeftRef = useRef();
  const rimRightRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathing = Math.sin(t * 1.5) * 0.5;
    
    // Ignition flash dominates, then settles into breathing
    const flashMultiplier = 1 + (flashIgnition * 10);
    
    if (keyLightRef.current) {
      keyLightRef.current.intensity = (2 + breathing) * flashMultiplier;
    }
    if (rimLeftRef.current) {
      rimLeftRef.current.intensity = (4 + breathing) * flashMultiplier;
    }
    if (rimRightRef.current) {
      rimRightRef.current.intensity = (4 + breathing) * flashMultiplier;
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} color="#00f0ff" />
      {/* Warm Gold Key Light */}
      <pointLight ref={keyLightRef} position={[0, 4, 3]} color="#FFD700" distance={15} intensity={2} />
      {/* Cool Teal/Cyan Rim Lights */}
      <spotLight ref={rimLeftRef} position={[-8, 2, -4]} color="#00f0ff" intensity={4} angle={0.8} penumbra={1} distance={20} />
      <spotLight ref={rimRightRef} position={[8, 3, -2]} color="#00f0ff" intensity={4} angle={0.8} penumbra={1} distance={20} />
    </>
  );
}

// 4. Glassy Floating Orbs (Fade in during flash)
function FloatingOrb({ position, color, scale, floatSpeed, flashIgnition, hasFlashed }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      if (!hasFlashed && flashIgnition === 0) {
        meshRef.current.scale.setScalar(0);
      } else if (flashIgnition > 0) {
        // Pop in scale during flash
        const currentScale = meshRef.current.scale.x;
        const targetScale = scale;
        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.1));
      }
    }
  });

  return (
    <Float speed={floatSpeed} rotationIntensity={1} floatIntensity={1.5} floatingRange={[-0.5, 0.5]}>
      <mesh ref={meshRef} position={position} scale={0}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial 
          color={color}
          transmission={0.95} 
          opacity={1}
          transparent
          roughness={0.05}
          ior={1.3}
          thickness={0.5}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
    </Float>
  );
}

// 7 & 8. Stars, Particles + Ignition Burst
function AtmosphereParticles({ isMobile, flashIgnition }) {
  const burstGroup = useRef();
  
  useFrame(() => {
    if (burstGroup.current && flashIgnition > 0) {
      // Burst expands rapidly
      const scale = 1 + (flashIgnition * 3);
      burstGroup.current.scale.set(scale, scale, scale);
    } else if (burstGroup.current) {
      burstGroup.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group>
      <group ref={burstGroup}>
        <Sparkles count={isMobile ? 20 : 50} scale={15} size={3} speed={0.5} opacity={flashIgnition > 0 ? flashIgnition : 0} color="#00f0ff" />
      </group>
      {/* Drifting dust tinted cool white/teal */}
      <Sparkles count={isMobile ? 40 : 80} scale={20} size={1.5} speed={0.1} opacity={0.3} color="#a5f3fc" />
      <Stars radius={30} depth={10} count={isMobile ? 500 : 1200} factor={4} saturation={0.5} fade speed={1.5} />
    </group>
  );
}

function PremiumScene({ isMobile, introPhase, flashIgnition, hasFlashed }) {
  const orbs = useMemo(() => [
    { pos: [-7, 2, -3], color: '#FFD700', scale: 0.9, speed: 0.8 },   
    { pos: [6, 4, -4], color: '#20C973', scale: 1.1, speed: 1.1 },    
    { pos: [-8, -2, -5], color: '#4f46e5', scale: 1.2, speed: 0.9 },  
    { pos: [8, -3, -3], color: '#34d399', scale: 0.7, speed: 1.2 },   
    { pos: [-4, 6, -6], color: '#00f0ff', scale: 0.8, speed: 0.7 },   
    { pos: [7, -1, -6], color: '#1e3a8a', scale: 1.3, speed: 1.3 },   
  ], []);

  useFrame((state) => {
    // Parallax
    const targetX = (state.pointer.x * 2);
    const targetY = 1 + (state.pointer.y * 1.5);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <Environment preset="night" />
      <TechLighting flashIgnition={flashIgnition} />
      <HolographicGrid />
      <TechStage flashIgnition={flashIgnition} />
      <GoldenTrophy introPhase={introPhase} flashIgnition={flashIgnition} />
      
      {orbs.map((orb, i) => (
        <FloatingOrb 
          key={i} 
          position={orb.pos} 
          color={orb.color} 
          scale={isMobile ? orb.scale * 0.7 : orb.scale} 
          floatSpeed={orb.speed} 
          flashIgnition={flashIgnition}
          hasFlashed={hasFlashed}
        />
      ))}
      
      <AtmosphereParticles isMobile={isMobile} flashIgnition={flashIgnition} />
    </>
  );
}

// 1, 2, 4, 6. Base Gradient, Horizon Glow, Mist, Tech Accents, and Sweep Intro
function TechAtmosphere({ introPhase, flashIgnition, hasFlashed }) {
  // Intro Sweep line
  const sweepBottom = hasFlashed ? '100%' : `${introPhase * 100}%`;
  const isSweeping = introPhase > 0 && !hasFlashed;

  return (
    <>
      {/* AI Generated Image Background */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: 'url(/hero-light-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.9 
        }} 
      />

      {/* Energy Horizon: soft teal line low in the frame */}
      <div 
        className="absolute bottom-10 left-0 right-0 h-[1px] bg-cyan-400 opacity-30 shadow-[0_0_20px_5px_rgba(0,240,255,0.5)] pointer-events-none transition-opacity duration-1000"
        style={{ opacity: hasFlashed ? 0.3 : 0 }}
      />

      {/* Teal/Cyan Mist Layers */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-[#00f0ff15] via-transparent to-transparent opacity-60 blur-3xl transition-opacity duration-1000"
        style={{ opacity: hasFlashed ? 0.6 : 0, animation: 'pulse 8s infinite alternate' }}
      />
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,_var(--tw-gradient-stops))] from-[#0088ff15] via-transparent to-transparent opacity-50 blur-3xl transition-opacity duration-1000"
        style={{ opacity: hasFlashed ? 0.5 : 0, animation: 'pulse 10s infinite alternate-reverse' }}
      />

      {/* Fine Tech Accents: corner brackets */}
      <div className={`absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#00f0ff] opacity-${hasFlashed ? '30' : '0'} transition-opacity duration-1000`} />
      <div className={`absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[#00f0ff] opacity-${hasFlashed ? '30' : '0'} transition-opacity duration-1000`} />
      <div className={`absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[#00f0ff] opacity-${hasFlashed ? '30' : '0'} transition-opacity duration-1000`} />
      <div className={`absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#00f0ff] opacity-${hasFlashed ? '30' : '0'} transition-opacity duration-1000`} />
      
      {/* Scanline overlay (subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

      {/* Intro Black Frame & Teal Sweep */}
      {!hasFlashed && (
        <div 
          className="absolute inset-0 bg-white z-10 pointer-events-none"
          style={{ 
            clipPath: `polygon(0 ${100 - (introPhase*100)}%, 100% ${100 - (introPhase*100)}%, 100% 100%, 0 100%)`,
            opacity: isSweeping ? 1 : 0
          }}
        />
      )}
      {!hasFlashed && isSweeping && (
        <div 
          className="absolute left-0 right-0 h-[2px] bg-[#00f0ff] z-20 shadow-[0_0_15px_3px_#00f0ff] pointer-events-none"
          style={{ bottom: sweepBottom }}
        />
      )}
      
      {/* Flash Ignition Overlay (brief white/teal flash) */}
      <div 
        className="absolute inset-0 bg-[#00f0ff] z-30 pointer-events-none mix-blend-screen"
        style={{ opacity: flashIgnition * 0.5 }}
      />
    </>
  );
}

export default function Trophy3D() {
  const [isMobile, setIsMobile] = useState(false);
  const [introPhase, setIntroPhase] = useState(0); // 0 to 1 (sweep up)
  const [flashIgnition, setFlashIgnition] = useState(0); // 1 to 0 (flash fade out)
  const [hasFlashed, setHasFlashed] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Signature Entrance Timing
  useEffect(() => {
    let startTime = Date.now();
    const sweepDuration = 1500; // 1.5s sweep
    const flashDuration = 1000; // 1s flash fade
    
    let frameId;
    
    const tick = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < sweepDuration) {
        // Phase 1: Sweep up
        setIntroPhase(elapsed / sweepDuration);
        frameId = requestAnimationFrame(tick);
      } else if (elapsed < sweepDuration + flashDuration) {
        // Phase 2: Ignition Flash
        if (!hasFlashed) setHasFlashed(true);
        const flashElapsed = elapsed - sweepDuration;
        setFlashIgnition(1 - (flashElapsed / flashDuration));
        frameId = requestAnimationFrame(tick);
      } else {
        // Phase 3: Settled
        setIntroPhase(1);
        setFlashIgnition(0);
        setHasFlashed(true);
      }
    };
    
    // Start sequence
    frameId = requestAnimationFrame(tick);
    
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden pointer-events-none bg-white">
      <TechAtmosphere introPhase={introPhase} flashIgnition={flashIgnition} hasFlashed={hasFlashed} />
      
      <Canvas 
        shadows 
        camera={{ position: [0, 1, 14], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <React.Suspense fallback={null}>
          <PremiumScene 
            isMobile={isMobile} 
            introPhase={introPhase} 
            flashIgnition={flashIgnition} 
            hasFlashed={hasFlashed} 
          />
        </React.Suspense>
      </Canvas>
      
      {/* Verify buttons and all text remain fully readable by ensuring contrast over grid/tech lines */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none opacity-90" />
    </div>
  );
}
