import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, RoundedBox, Float } from '@react-three/drei'

export default function Image3D() {
  const meshRef = useRef()
  
  // Load the festival image we generated earlier
  const texture = useTexture('/hero-bg.png')

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating and spinning animation
      meshRef.current.rotation.y += 0.005;
    }
  })

  return (
    <Float
      speed={2} 
      rotationIntensity={0.2} 
      floatIntensity={0.5}
      floatingRange={[-0.1, 0.1]}
    >
      <group position={[0, -0.5, 0]}>
        <mesh ref={meshRef}>
          {/* A flat plane with rounded corners to display the image */}
          <boxGeometry args={[4.8, 2.7, 0.1]} />
          <meshStandardMaterial 
            map={texture} 
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>
      </group>
    </Float>
  )
}
