'use client'
import { Environment, OrbitControls } from "@react-three/drei";
import { Book } from "./Book";
import { Page } from "@/types/pages";

export const Experience = () => {
  const pages: Page[] = [
    {
      id: "1",
      contentFront: {
        title: "Front Page",
        content: "This is the front page of the book.",
        image: "/placeholder1.png"
     },
      contentBack: {
        title: "Back Page",
        content: "This is the back page of the book.", 
        image: "/placeholder2.png"
      }
    },
    {
      id: "2", 
      contentFront: {
        title: "Second Page",
        content: "This is the second page of the book.",
        image: "/placeholder3.png"
      },
      contentBack: {
        title: "Third Page",
        content: "This is the third page of the book.",
        image: "/placeholder1.png"
      }
    },
    {
      id: "3",
      contentFront: {
        title: "Fourth Page",
        content: "This is the fourth page of the book.",
        image: "/placeholder2.png"
      },
      contentBack: {
        title: "Fifth Page", 
        content: "This is the fifth page of the book.",
        image: "/placeholder3.png"
      }
    },
    {
      id: "4",
      contentFront: {
        title: "Sixth Page",
        content: "This is the sixth page of the book.",
        image: "/placeholder1.png"
      },
      contentBack: {
        title: "Last Page",
        content: "This is the final page of the book.",
        image: "/placeholder2.png"
      }
    }
  ]

  return (
    <>
      <Book pages={pages} currentPage={0} />
      <OrbitControls />
      <Environment preset="studio"></Environment>
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