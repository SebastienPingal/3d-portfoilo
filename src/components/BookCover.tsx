'use client'

import { ThreeElements } from "@react-three/fiber"
import { useFrame } from "@react-three/fiber"
import { useRef, useMemo, useEffect, useState } from "react"
import { MeshStandardMaterial, BoxGeometry, Color, Mesh } from "three"
import { easing } from "maath"
import { PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH } from "./Page"
import { Page as PageType } from "@/types/pages"
import { degToRad, MathUtils } from "three/src/math/MathUtils.js"
import { useCursor } from "@react-three/drei"

export const COVER_WIDTH = PAGE_WIDTH + PAGE_WIDTH * 0.05
export const COVER_HEIGHT = PAGE_HEIGHT + PAGE_HEIGHT * 0.05
export const COVER_DEPTH = 0.05

const emissiveColor = new Color("orange")

const easingFactor = 0.3

const bookCoverGeometry = new BoxGeometry(
  COVER_WIDTH,
  COVER_HEIGHT,
  COVER_DEPTH
)

bookCoverGeometry.translate(COVER_WIDTH / 2, 0, 0)

const bookCoverMaterial = new MeshStandardMaterial({
  color: '#8B4513',
  roughness: 0.7,
  metalness: 0.1,
  emissive: emissiveColor,
  emissiveIntensity: 0
})

export const BookCover = ({ isBack = false, lastPage, bookClosed, pages, setTargetPage, targetPage, ...props }: {
  isBack?: boolean
  lastPage: boolean
  bookClosed: boolean
  pages: PageType[]
  setTargetPage: (page: number) => void
  targetPage: number
} & ThreeElements['group']) => {
  const mesh = useRef<Mesh>(null)

  const manualMesh = useMemo(() => {
    const material = bookCoverMaterial.clone()
    const thisMesh = new Mesh(bookCoverGeometry, material)
    thisMesh.castShadow = true
    thisMesh.receiveShadow = true
    return thisMesh
  }, [])

  // Use useRef to store initial position and initialize in useEffect
  const initialPosition = useRef<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    if (mesh.current) {
      initialPosition.current = [
        mesh.current.position.x,
        mesh.current.position.y,
        mesh.current.position.z
      ]
    }
  }, [])

  useFrame((_, delta) => {
    if (!mesh.current) return

    const emissiveIntensity = highlighted ? 0.08 : 0
    const material = mesh.current.material as MeshStandardMaterial
    material.emissiveIntensity = MathUtils.lerp(
      material.emissiveIntensity,
      emissiveIntensity,
      0.1
    )

    let targetRotation = !bookClosed ? degToRad(-85) : degToRad(90)
    const [baseX, baseY, baseZ] = initialPosition.current
    let targetPosition: [number, number, number] = [baseX, baseY, baseZ]

    if (isBack && !lastPage) {
      targetRotation = degToRad(90)
    }
    if (isBack && !bookClosed) {
      targetPosition = [baseX + COVER_DEPTH / 2 + PAGE_DEPTH * (pages.length), baseY, baseZ - COVER_DEPTH / 2 - PAGE_DEPTH * (pages.length)]
    }
    if (lastPage) {
      targetRotation = degToRad(-85)
    }

    easing.dampAngle(
      mesh.current.rotation,
      "y",
      targetRotation,
      easingFactor,
      delta
    )

    easing.damp3(
      mesh.current.position,
      targetPosition,
      0.3,
      delta
    )
  })

  const [highlighted, setHighlighted] = useState(false)
  useCursor(highlighted)

  return (
    <group {...props}
      onPointerEnter={(e) => {
        e.stopPropagation()
        setHighlighted(true)
      }}
      onPointerLeave={() => {
        setHighlighted(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (isBack) {
          const newPage = targetPage === pages.length + 1
            ? pages.length + 2
            : pages.length + 1
          setTargetPage(newPage)
        } else {
          const newPage = targetPage === 1 ? 0 : 1
          setTargetPage(newPage)
        }
      }}
    >
      <primitive
        ref={mesh}
        object={manualMesh}
      />
    </group>
  )
}
