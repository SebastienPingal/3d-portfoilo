'use client'
import { Environment, Float, OrbitControls } from "@react-three/drei";
import { Book } from "./Book";
import { Page } from "@/types/pages";

export const Experience = ({ targetPage, pages, setTargetPage }: { targetPage: number, pages: Page[], setTargetPage: (page: number) => void }) => {
  return (
    <>
      <Float
      >
        <Book pages={pages} targetPage={targetPage} setTargetPage={setTargetPage} rotation-y={-Math.PI / 2} />
      </Float>
      <OrbitControls />
      {/* <Environment preset="studio"></Environment> */}
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};