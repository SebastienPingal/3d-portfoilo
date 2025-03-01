'use client'
import { Experience } from "@/components/Experience"
import { UI } from "@/components/UI"
import { Loader } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useState } from "react"
import { Page } from "@/types/pages"
import CssPixelation from "@/components/CSSPixelation"

export default function Home() {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([-0.5, 1, 9])
  const [currentPage, setCurrentPage] = useState(0)

  const pages: Page[] = [
    {
      id: "1",
      contentFront: {
        title: "Hello",
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
        title: "Benco",
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
        title: "Breni",
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
        title: "Rafael",
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


  useEffect(() => {
    // Only access window after component has mounted (client-side)
    setCameraPosition([-0.5, 1, window.innerWidth > 800 ? 4 : 9])
  }, [])

  return (
    <div className="h-full">
      <UI pages={pages} currentPage={currentPage} setCurrentPage={setCurrentPage} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10" />
      <Loader />
      <CssPixelation>
        <Canvas shadows camera={{
          position: cameraPosition,
          fov: 45,
        }}>
          <group position-y={0}>
            <Suspense fallback={null}>
              <Experience currentPage={currentPage} pages={pages} setCurrentPage={setCurrentPage} />
            </Suspense>
          </group>
        </Canvas>
      </CssPixelation>
    </div>
  )
}