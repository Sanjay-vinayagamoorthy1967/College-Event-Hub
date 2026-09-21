import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function MugModel() {
  const mugRef = useRef();
  
  // Load the campus image to wrap around the mug
  const texture = useTexture('/hero-bg.webp');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  // Optional: adjust offset if the image isn't centered perfectly
  texture.offset.set(0, 0);

  useFrame((state, delta) => {
    if (mugRef.current) {
      mugRef.current.rotation.y += delta * 0.4;
    }
  });

  const ceramicMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.1,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const wrappedMaterial = new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  });

  return (
    <group ref={mugRef} dispose={null} position={[0, -1, 0]}>
      {/* Mug Body (Outer with image) */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 2.5, 64, 1, true]} />
        <primitive object={wrappedMaterial} attach="material" />
      </mesh>
      
      {/* Mug Body (Inner ceramic) */}
      <mesh receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 2.5, 64, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} metalness={0.1} side={THREE.BackSide} />
      </mesh>

      {/* Mug Bottom (Inside) */}
      <mesh receiveShadow position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 64]} />
        <primitive object={ceramicMaterial} attach="material" />
      </mesh>

      {/* Mug Bottom (Outside) */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 64]} />
        <primitive object={ceramicMaterial} attach="material" />
      </mesh>

      {/* Mug Top Rim */}
      <mesh castShadow receiveShadow position={[0, 2.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.175, 0.025, 16, 64]} />
        <primitive object={ceramicMaterial} attach="material" />
      </mesh>

      {/* Mug Bottom Rim */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.175, 0.025, 16, 64]} />
        <primitive object={ceramicMaterial} attach="material" />
      </mesh>

      {/* Mug Handle */}
      <mesh castShadow receiveShadow position={[1.3, 1.2, 0]}>
        <torusGeometry args={[0.6, 0.15, 32, 64, Math.PI]} />
        <primitive object={ceramicMaterial} attach="material" />
      </mesh>
    </group>
  );
}

export default function Mug3D() {
  return (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-auto">
      <Canvas 
        shadows 
        camera={{ position: [0, 1.5, 8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.8} />
          <directionalLight 
            castShadow 
            position={[5, 10, 5]} 
            intensity={1.5} 
            color="#ffffff"
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          
          <MugModel />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
