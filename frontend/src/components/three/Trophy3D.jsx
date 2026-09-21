import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Torus, Sphere, Icosahedron, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function TrophyBase() {
  return (
    <group position={[0, -1.8, 0]}>
      {/* Base platform */}
      <RoundedBox args={[1.6, 0.3, 1.6]} radius={0.08} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.25, 1.2]} radius={0.06} position={[0, 0.275, 0]}>
        <meshStandardMaterial color="#2d1b69" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      {/* Base pillar */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 0.6, 32]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.95} roughness={0.05} />
      </mesh>
    </group>
  )
}

function TrophyCup() {
  return (
    <group position={[0, -0.3, 0]}>
      {/* Main cup body */}
      <mesh position={[0, 0.3, 0]}>
        <latheGeometry args={[
          [
            new THREE.Vector2(0.0, -0.5),
            new THREE.Vector2(0.3, -0.5),
            new THREE.Vector2(0.2, -0.2),
            new THREE.Vector2(0.15, 0.0),
            new THREE.Vector2(0.2, 0.2),
            new THREE.Vector2(0.5, 0.6),
            new THREE.Vector2(0.7, 0.9),
            new THREE.Vector2(0.75, 1.0),
            new THREE.Vector2(0.73, 1.05),
            new THREE.Vector2(0.65, 1.05),
          ],
          32
        ]} />
        <meshStandardMaterial 
          color="#F59E0B" 
          metalness={0.95} 
          roughness={0.05}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Inner cup */}
      <mesh position={[0, 1.1, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.5, 0.3, 32, 1, true]} />
        <meshStandardMaterial 
          color="#b45309" 
          metalness={0.8} 
          roughness={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

function TrophyHandles() {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Left handle */}
      <Torus args={[0.3, 0.04, 16, 32, Math.PI]} position={[-0.75, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#F59E0B" metalness={0.95} roughness={0.05} />
      </Torus>
      {/* Right handle */}
      <Torus args={[0.3, 0.04, 16, 32, Math.PI]} position={[0.75, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <meshStandardMaterial color="#F59E0B" metalness={0.95} roughness={0.05} />
      </Torus>
    </group>
  )
}

function TrophyStar() {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
      <group position={[0, 1.5, 0]}>
        <Icosahedron args={[0.15, 0]}>
          <meshStandardMaterial 
            color="#F59E0B" 
            metalness={1} 
            roughness={0} 
            emissive="#F59E0B"
            emissiveIntensity={0.3}
          />
        </Icosahedron>
        {/* Star glow */}
        <Sphere args={[0.25, 16, 16]}>
          <meshBasicMaterial color="#F59E0B" transparent opacity={0.1} />
        </Sphere>
      </group>
    </Float>
  )
}

function FloatingOrbs() {
  const orbsRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (orbsRef.current) {
      orbsRef.current.rotation.y = time * 0.3
    }
  })

  return (
    <group ref={orbsRef}>
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 2.5
        const y = Math.sin(i * 1.5) * 0.5
        return (
          <Float key={i} speed={1.5 + i * 0.3} rotationIntensity={0.2} floatIntensity={0.5}>
            <Sphere
              args={[0.06 + Math.random() * 0.06, 16, 16]}
              position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
            >
              <meshStandardMaterial
                color={i % 3 === 0 ? '#8B5CF6' : i % 3 === 1 ? '#EC4899' : '#F59E0B'}
                emissive={i % 3 === 0 ? '#8B5CF6' : i % 3 === 1 ? '#EC4899' : '#F59E0B'}
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
              />
            </Sphere>
          </Float>
        )
      })}
    </group>
  )
}

function GlowRings() {
  const ringsRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (ringsRef.current) {
      ringsRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
      ringsRef.current.rotation.z = Math.cos(time * 0.3) * 0.05
    }
  })

  return (
    <group ref={ringsRef} position={[0, 0, 0]}>
      <Torus args={[2, 0.008, 16, 100]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.2} />
      </Torus>
      <Torus args={[2.5, 0.005, 16, 100]} rotation={[Math.PI / 2.2, 0.2, 0]} position={[0, -0.3, 0]}>
        <meshBasicMaterial color="#EC4899" transparent opacity={0.15} />
      </Torus>
    </group>
  )
}

export default function Trophy3D() {
  const groupRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.15
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.1
    }
  })

  return (
    <group ref={groupRef} scale={1.1}>
      <TrophyBase />
      <TrophyCup />
      <TrophyHandles />
      <TrophyStar />
      <FloatingOrbs />
      <GlowRings />
    </group>
  )
}
