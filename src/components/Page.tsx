import { Page as PageType } from "@/types/pages"
import { useCursor, useTexture } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { useRef, useMemo, useState, useCallback } from "react"
import { Bone, BoxGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Skeleton, SkinnedMesh, SRGBColorSpace, Uint16BufferAttribute, Vector3 } from "three"
import { degToRad } from "three/src/math/MathUtils.js"
import { easing } from "maath"
import { MathUtils } from "three"

const easingFactor = 0.5 // if quicker, adjust turningPageTime
const easingFactorFold = 0.3
const turningPageTime = 400 // if quicker, adjust easingFactor
const insideCurveStrength = 0.16
const outsideCurveStrength = 0.05
const turningCurveStrength = 0.09

const openAngle = degToRad(-87)
const closeAngle = degToRad(89)

// Replace global constants with variables based on props
export const PAGE_DEPTH = 0.014
export const PAGE_SEGMENTS = 30

// Create a function to generate geometries based on dimensions
const createGeometries = (pageWidth: number, pageHeight: number) => {
  const SEGMENT_WIDTH = pageWidth / PAGE_SEGMENTS

  const COVER_WIDTH = pageWidth + pageWidth * 0.05
  const COVER_HEIGHT = pageHeight + pageHeight * 0.05
  const COVER_DEPTH = 0.05

  // Create page geometry
  const pageGeometry = new BoxGeometry(
    pageWidth,
    pageHeight,
    PAGE_DEPTH,
    PAGE_SEGMENTS,
    2
  )

  pageGeometry.translate(pageWidth / 2, 0, 0)

  const position = pageGeometry.attributes.position
  const vertex = new Vector3()
  const skinIndexes = []
  const skinWeights = []

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i)
    const x = vertex.x

    const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH))
    const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH

    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0)
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
  }

  pageGeometry.setAttribute(
    'skinIndex',
    new Uint16BufferAttribute(skinIndexes, 4)
  )

  pageGeometry.setAttribute(
    'skinWeight',
    new Float32BufferAttribute(skinWeights, 4)
  )

  // Create cover geometry
  const coverGeometry = new BoxGeometry(
    COVER_WIDTH,
    COVER_HEIGHT,
    COVER_DEPTH,
    1,
    2
  )
  coverGeometry.translate(COVER_WIDTH / 2, 0, 0)

  return {
    pageGeometry,
    coverGeometry,
    SEGMENT_WIDTH,
    COVER_WIDTH,
    COVER_HEIGHT,
    COVER_DEPTH
  }
}

const whiteColor = new Color("white")
const emissiveColor = new Color("orange")

const pageMaterials = [
  new MeshStandardMaterial({ color: "white" }),
  new MeshStandardMaterial({ color: "white" }),
  new MeshStandardMaterial({ color: "white" }),
  new MeshStandardMaterial({ color: "white" }),
]

const coverMaterial = new MeshStandardMaterial({
  color: '#8B4513',
  roughness: 0.8,
  metalness: 0,
  emissive: emissiveColor,
  emissiveIntensity: 0
})

export const Page = ({ pageRef, page, number, opened, bookClosed, numberOfPages, setTargetPage, isCover = false, isFront = true, pageWidth = 2, pageHeight = 1.5, ...props }: {
  pageRef?: React.RefObject<Mesh | null>,
  page: PageType,
  number: number,
  opened: boolean,
  bookClosed: boolean,
  numberOfPages: number,
  setTargetPage: (page: number) => void,
  isCover?: boolean,
  isFront?: boolean,
  pageWidth?: number,
  pageHeight?: number
} & ThreeElements['group']) => {

  const texturePaths = [
    page?.contentFront?.image,
    page?.contentBack?.image,
    page?.contentFront?.imageRoughness,
    page?.contentBack?.imageRoughness
  ].filter(Boolean) as string[]

  const textures = useTexture(texturePaths)

  const front = page?.contentFront?.image ? textures[0] : null
  const back = page?.contentBack?.image ? textures[texturePaths.indexOf(page?.contentBack?.image)] : null
  const frontRoughness = page?.contentFront?.imageRoughness ? textures[texturePaths.indexOf(page?.contentFront?.imageRoughness)] : null
  const backRoughness = page?.contentBack?.imageRoughness ? textures[texturePaths.indexOf(page?.contentBack?.imageRoughness)] : null

  if (front) front.colorSpace = SRGBColorSpace
  if (back) back.colorSpace = SRGBColorSpace

  const group = useRef<Group>(null)
  const turnedAt = useRef<number>(0)
  const lastOpened = useRef<boolean>(opened)
  const skinnedMesh = useRef<SkinnedMesh | Mesh>(null)

  // Create a callback ref that updates both refs
  const setRefs = useCallback((node: Mesh | null) => {
    // Set the internal ref
    skinnedMesh.current = node

    // Set the external ref if provided
    if (pageRef && node) {
      pageRef.current = node
    }
  }, [pageRef])

  // Create geometries based on props
  const { pageGeometry, coverGeometry, SEGMENT_WIDTH, COVER_DEPTH } = useMemo(() =>
    createGeometries(pageWidth, pageHeight)
    , [pageWidth, pageHeight])

  const manualSkinnedMesh = useMemo(() => {
    const bones = []

    if (isCover) {
      // // Create just one bone for the cover
      // const bone = new Bone()
      // bone.position.x = 0
      // bones.push(bone)
    } else {
      // Create multiple bones for regular pages
      for (let i = 0; i <= PAGE_SEGMENTS; i++) {
        const bone = new Bone()
        bones.push(bone)
        if (i === 0) {
          bone.position.x = 0
        } else {
          bone.position.x = SEGMENT_WIDTH
        }
        if (i > 0) {
          bones[i - 1].add(bone)
        }
      }
    }

    let skeleton
    let rootBone
    if (!isCover) {
      // Create a root bone to ensure proper hierarchy
      rootBone = new Bone()
      rootBone.add(bones[0])
      bones.unshift(rootBone)
      skeleton = new Skeleton(bones)
    }

    let materials
    if (isCover) {
      // Make sure we're using an array of materials even for cover
      materials = Array(6).fill(coverMaterial)
    } else {
      materials = [...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: front,
        roughnessMap: frontRoughness,
        roughness: 0.8,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: back,
        roughnessMap: backRoughness,
        roughness: 0.8,
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      ]
    }
    let mesh
    if (!isCover) {
      mesh = new SkinnedMesh(pageGeometry, materials)
    } else {
      mesh = new Mesh(coverGeometry, materials)
    }

    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    if (!isCover && rootBone) {
      mesh.add(rootBone)  // Add the root bone to the mesh
    }
    if (!isCover && skeleton && mesh instanceof SkinnedMesh) {
      mesh.bind(skeleton)
    }

    // Update the bone matrices immediately to avoid the error
    if (!isCover && skeleton) {
      skeleton.pose()
      skeleton.update()
    }

    return mesh
  }, [front, back, frontRoughness, backRoughness, isCover, SEGMENT_WIDTH, pageGeometry, coverGeometry])

  useFrame((_, delta) => {
    if (!skinnedMesh.current) return

    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date()
      lastOpened.current = opened
    }
    let turningTime = Math.min(turningPageTime, +new Date() - turnedAt.current) / turningPageTime
    turningTime = Math.sin(turningTime * Math.PI)

    let targetRotation = opened ? openAngle : closeAngle
    if (!bookClosed) {
      targetRotation += degToRad((number - 1) * 0.9)
    }

    const emissiveIntensity = highlighted ? 0.08 : 0
    const materials = skinnedMesh.current.material as MeshStandardMaterial[]
    if (materials[4]?.emissiveIntensity !== undefined) {
      materials[4].emissiveIntensity =
        materials[5].emissiveIntensity = MathUtils.lerp(
          materials[4].emissiveIntensity, emissiveIntensity, 0.1
        )
    }

    if (isCover && group.current) {
      let rotationAngle = targetRotation
      if (bookClosed) {
        rotationAngle = 0
      }
      easing.dampAngle(
        skinnedMesh.current.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      )

      // easing.dampAngle(
      //   group.current.rotation,
      //   "y",
      //   rotationAngle,
      //   easingFactor,
      //   delta
      // )
    }

    if (!isCover && skinnedMesh.current instanceof SkinnedMesh) {
      const bones = skinnedMesh.current.skeleton.bones
      for (let i = 1; i < bones.length; i++) {
        const target = bones[i]
        let rotationAngle = 0

        let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2)

        if (bookClosed) {
          if (i === 0) {
            rotationAngle = targetRotation
            foldRotationAngle = 0
          } else {
            rotationAngle = 0
          }
        } else {

          const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0
          const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 - 0.9) : 0
          const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime

          rotationAngle =
            insideCurveIntensity * insideCurveStrength * targetRotation -
            outsideCurveIntensity * outsideCurveStrength * targetRotation +
            turningIntensity * turningCurveStrength * targetRotation
        }

        const foldIntensity = i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0

        if (target) {
          easing.dampAngle(
            target.rotation,
            "y",
            rotationAngle,
            easingFactor,
            delta
          )
          easing.dampAngle(
            target.rotation,
            "x",
            foldRotationAngle * foldIntensity,
            easingFactorFold,
            delta
          )
        }
      }
      skinnedMesh.current.skeleton.update()
    }
  })

  const [highlighted, setHighlighted] = useState(false)
  useCursor(highlighted)
  let positionZ = -COVER_DEPTH / 2 - PAGE_DEPTH / 2 - (number - 1) * PAGE_DEPTH
  if (isCover && isFront) {
    positionZ = 0
  }
  if (isCover && !isFront) {
    positionZ -= COVER_DEPTH / 2 - PAGE_DEPTH / 2
  }

  return (
    <group ref={group} {...props}
      onPointerEnter={(e) => {
        e.stopPropagation()
        setHighlighted(true)
      }}
      onPointerLeave={() => {
        setHighlighted(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (isCover && isFront) setTargetPage(1)
        else if (isCover) setTargetPage(numberOfPages + 1)
        else setTargetPage(opened ? number : number + 1)
        setHighlighted(false)
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        position-z={positionZ}
        ref={setRefs}
      />
    </group>
  )
} 