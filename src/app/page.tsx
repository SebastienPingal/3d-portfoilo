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
  const [targetPage, setTargetPage] = useState(0)

  const pages: Page[] = [
    {
      id: "1",
      contentFront: {
        title: "Hello",
        content: "This is the front page of the book.",
        image: "/NewPlaceHolder1.jpg"
      },
      contentBack: {
        title: "Back Page",
        content: "This is the back page of the book.",
        image: "/NewPlaceHolder1.jpg"
      }
    },
    {
      id: "2",
      contentFront: {
        title: "Benco",
        content: "This is the second page of the book.",
        image: "/NewPlaceHolder2.jpg"
      },
      contentBack: {
        title: "Third Page",
        content: "This is the third page of the book.",
        image: "/NewPlaceHolder3.jpg"
      }
    },
    {
      id: "3",
      contentFront: {
        title: "Breni",
        content: "This is the fourth page of the book.",
        image: "/NewPlaceHolder4.jpg"
      },
      contentBack: {
        title: "Fifth Page",
        content: "This is the fifth page of the book.",
        image: "/NewPlaceHolder5.jpg"
      }
    },
    {
      id: "4",
      contentFront: {
        title: "Rafael",
        content: "This is the sixth page of the book.",
        image: "/NewPlaceHolder6.jpg"
      },
      contentBack: {
        title: "Last Page",
        content: "This is the 7th page of the book.",
        image: "/NewPlaceHolder7.jpg"
      }
    },
    {
      id: "5",
      contentFront: {
        title: "Last Page",
        content: "This is the 8th page of the book.",
        image: "/NewPlaceHolder8.jpg"
      },
      contentBack: {
        title: "Last Page",
        content: "This is the 9th page of the book.",
        image: "/NewPlaceHolder9.jpg"
      }
    },
    {
      id: "6",
      contentFront: {
        title: "Last Page",
        content: "This is the 10th page of the book.",
        image: "/NewPlaceHolder10.jpg"
      },
      contentBack: {
        title: "Last Page",
        content: "This is the 11th page of the book.",
        image: "/NewPlaceHolder11.jpg"
      }
    }
  ]


  useEffect(() => {
    // Only access window after component has mounted (client-side)
    setCameraPosition([-0.5, 1, window.innerWidth > 800 ? 4 : 9])
  }, [])

  return (
    <div className="h-full">
      <UI pages={pages} targetPage={targetPage} setTargetPage={setTargetPage} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10" />
      <Loader />
      <CssPixelation>
        <Canvas shadows camera={{
          position: cameraPosition,
          fov: 45,
        }}>
          <group position-y={0}>
            <Suspense fallback={null}>
              <Experience targetPage={targetPage} pages={pages} setTargetPage={setTargetPage} />
            </Suspense>
          </group>
        </Canvas>
      </CssPixelation>
    </div>
  )
}