import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import ParticleField from './ParticleField'
import Trophy3D from './Trophy3D'

function MouseParallax({ children }) {
  const groupRef = useRef()
  const { pointer } = useThree()

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += (pointer.x * 0.3 - groupRef.current.rotation.y) * 0.05
      groupRef.current.rotation.x += (pointer.y * 0.15 - groupRef.current.rotation.x) * 0.05
    }
  })

  return <group ref={groupRef}>{children}</group>
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#FF8A5B" />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#4ADE80" />
      <pointLight position={[0, 5, 0]} intensity={1} color="#FF8A5B" distance={15} />
      <pointLight position={[-3, 2, 3]} intensity={0.6} color="#FFC857" distance={10} />
      <pointLight position={[3, -1, -2]} intensity={0.4} color="#4ADE80" distance={10} />
      <spotLight
        position={[0, 8, 0]}
        angle={0.4}
        penumbra={0.8}
        intensity={1.2}
        color="#FF8A5B"
        castShadow
      />
    </>
  )
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0.5, 5]} fov={50} />
        <Suspense fallback={null}>
          <Lights />
          <MouseParallax>
            <Trophy3D />
          </MouseParallax>
          <ParticleField count={1500} />
          <Environment preset="night" />
        </Suspense>
        <fog attach="fog" args={['#0B0B0F', 8, 25]} />
      </Canvas>
    </div>
  )
}
