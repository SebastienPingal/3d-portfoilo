'use client'
import { Page as PageType } from "@/types/pages"
import { useFrame, ThreeElements } from "@react-three/fiber"
import { Page, PAGE_DEPTH } from "./Page"
import { useEffect, useRef, useState, useMemo } from "react"
import { Vector3, Mesh, Group, BoxGeometry, MeshStandardMaterial } from "three"
import { degToRad } from "three/src/math/MathUtils.js"
import { easing } from "maath"

export const Book = ({ pages, targetPage, setTargetPage, pageWidth = 1.5, pageHeight = 2, ...props }: { pages: PageType[], targetPage: number, setTargetPage: (page: number) => void, pageWidth: number, pageHeight: number } & ThreeElements['group']) => {
  const [delayedPage, setDelayedPage] = useState(targetPage)
  const backCoverRef = useRef<Mesh>(null)
  const frontCoverRef = useRef<Mesh>(null)
  const [backCoverPosition, setBackCoverPosition] = useState(new Vector3())
  const group = useRef<Group>(null)

  const openAngle = degToRad(-87)
  const closeAngle = degToRad(89)
  const easingFactor = 0.5

  // Create spine geometry and material
  const spineProps = useMemo(() => {
    const COVER_DEPTH = 0.05
    const COVER_HEIGHT = pageHeight + pageHeight * 0.05
    const spineWidth = (pages.length * PAGE_DEPTH) + (COVER_DEPTH * 2)
    
    const spineGeometry = new BoxGeometry(spineWidth, COVER_HEIGHT, COVER_DEPTH)
    spineGeometry.translate(spineWidth / 2 - COVER_DEPTH / 2, 0, 0)
    const spineMaterial = new MeshStandardMaterial({
      color: '#8B4513',
      roughness: 0.8,
      metalness: 0
    })
    
    return { spineGeometry, spineMaterial, spineWidth }
  }, [pageHeight, pages.length])

  useEffect(() => {
    // If we're already at the target, nothing to do
    if (targetPage === delayedPage) return

    // Calculate next page
    const nextPage = targetPage > delayedPage ? delayedPage + 1 : delayedPage - 1

    // Special check for cover closing movements
    const isCoverMoving =
      (nextPage === 0 && delayedPage === 1) ||
      (nextPage === pages.length + 2 && delayedPage === pages.length + 1) ||
      (nextPage === 1 && delayedPage === 0) ||
      (nextPage === pages.length && delayedPage === pages.length + 1)

    const delay = isCoverMoving ? 500 : 150

    // Schedule the state update after the appropriate delay
    const timeout = setTimeout(() => {
      setDelayedPage(nextPage)
    }, delay)

    return () => {
      clearTimeout(timeout)
    }
  }, [targetPage, delayedPage, pages.length])

  const bookClosed = delayedPage === 0 || delayedPage === pages.length + 2

  useFrame((_, delta) => {
    const lastPage = delayedPage === pages.length + 2
    let targetRotation = bookClosed ? closeAngle : 0
    if (lastPage) {
      targetRotation = openAngle
    }
    if (group.current) {
      easing.dampAngle(
        group.current.rotation,
        "y",
        targetRotation,
        easingFactor,
        delta
      )
    }
    // update the back cover position with pageRef
    if (backCoverRef.current) {
      setBackCoverPosition(backCoverRef.current.position)
    }
  })


  return (
    <group {...props} ref={group}>
      <Page
        pageRef={frontCoverRef}
        key="front-cover"
        page={{} as PageType}
        pageWidth={pageWidth}
        pageHeight={pageHeight}
        numberOfPages={pages.length}
        opened={delayedPage > 0}
        number={0}
        bookClosed={bookClosed}
        setTargetPage={setTargetPage}
        isCover={true}
        isFront={true}
      />
      {pages.map((page, index) => (
        <Page
          key={index}
          page={page}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          numberOfPages={pages.length}
          opened={delayedPage > index + 1}
          number={index + 1}
          bookClosed={bookClosed}
          setTargetPage={setTargetPage}
        />
      ))}
      <Page
        pageRef={backCoverRef}
        key="back-cover"
        page={{} as PageType}
        pageWidth={pageWidth}
        pageHeight={pageHeight}
        numberOfPages={pages.length}
        opened={delayedPage > pages.length + 1}
        number={pages.length + 1}
        bookClosed={bookClosed}
        setTargetPage={setTargetPage}
        isCover={true}
        isFront={false}
      />
      
      {/* Book spine */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[0, degToRad(90), 0]}
      >
        <primitive object={spineProps.spineGeometry} />
        <primitive object={spineProps.spineMaterial} />
      </mesh>
      
      {/* Debug cubes - you can remove these when done */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color={0x00ff00} />
      </mesh>
      <mesh position={backCoverPosition}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color={0x0000ff} />
      </mesh>
    </group>
  )
}