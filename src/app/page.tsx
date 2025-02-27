'use client'
import { Experience } from "@/components/Experience";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";

export default function Home() {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([-0.5, 1, 9]);
  
  useEffect(() => {
    // Only access window after component has mounted (client-side)
    setCameraPosition([-0.5, 1, window.innerWidth > 800 ? 4 : 9]);
  }, []);

  return (
    <div className="h-full">
      <Loader />
      <Canvas shadows camera={{
          position: cameraPosition,
          fov: 45,
        }}>
        <group position-y={0}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </group>
      </Canvas>
    </div>
  );
}

