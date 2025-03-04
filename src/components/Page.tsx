import { Page as PageType } from "@/types/pages"
import { useCursor, useTexture } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"
import { Bone, BoxGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Skeleton, SkinnedMesh, SRGBColorSpace, Uint16BufferAttribute, Vector3 } from "three"
import { degToRad } from "three/src/math/MathUtils.js"
import { easing } from "maath"
import { MathUtils } from "three"

const easingFactor = 0.5 // if quicker, adjust turningPageTime
const easingFactorFold = 0.3
const turningPageTime = 400 // if quicker, adjust easingFactor
const insideCurveStrength = 0.156
const outsideCurveStrength = 0.05
const turningCurveStrength = 0.09

const openAngle = degToRad(-87)
const closeAngle = degToRad(89)

export const PAGE_WIDTH = 1.28
export const PAGE_HEIGHT = 1.71
export const PAGE_DEPTH = 0.014
export const PAGE_SEGMENTS = 30
export const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS

export const COVER_WIDTH = PAGE_WIDTH + PAGE_WIDTH * 0.05
export const COVER_HEIGHT = PAGE_HEIGHT + PAGE_HEIGHT * 0.05
export const COVER_DEPTH = 0.05

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
)

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0)

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

const coverGeometry = new BoxGeometry(
  COVER_WIDTH,
  COVER_HEIGHT,
  COVER_DEPTH,
  1,
  2
)
coverGeometry.translate(COVER_WIDTH / 2, 0, 0)

// Add skinning attributes to cover geometry
const coverSkinIndexes = []
const coverSkinWeights = []

for (let i = 0; i < coverGeometry.attributes.position.count; i++) {
  coverSkinIndexes.push(0, 0, 0, 0)
  coverSkinWeights.push(1, 0, 0, 0)
}

coverGeometry.setAttribute(
  'skinIndex',
  new Uint16BufferAttribute(coverSkinIndexes, 4)
)

coverGeometry.setAttribute(
  'skinWeight',
  new Float32BufferAttribute(coverSkinWeights, 4)
)

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
  roughness: 0.2,
  metalness: 0.1,
  emissive: emissiveColor,
  emissiveIntensity: 0
})

export const Page = ({ page, number, opened, bookClosed, numberOfPages, setTargetPage, isCover = false, isFront = true, ...props }: {
  page: PageType,
  number: number,
  opened: boolean,
  bookClosed: boolean,
  numberOfPages: number,
  setTargetPage: (page: number) => void,
  isCover?: boolean,
  isFront?: boolean
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
  const skinnedMesh = useRef<SkinnedMesh>(null)

  const manualSkinnedMesh = useMemo(() => {
    const bones = []

    if (isCover) {
      // Create just one bone for the cover
      const bone = new Bone()
      bone.position.x = 0
      bones.push(bone)
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
    const skeleton = new Skeleton(bones)

    let materials
    if (isCover) {
      // Make sure we're using an array of materials even for cover
      materials = [coverMaterial, coverMaterial, coverMaterial, coverMaterial, coverMaterial, coverMaterial]
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
    const mesh = new SkinnedMesh(isCover ? coverGeometry : pageGeometry, materials)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.add(skeleton.bones[0])
    mesh.bind(skeleton)
    return mesh
  }, [front, back, frontRoughness, backRoughness, isCover])

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

    const bones = skinnedMesh.current.skeleton.bones
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i]
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
        if (isCover) {
          rotationAngle = targetRotation
        }
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
        console.log("pointer enter", number)
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
        ref={skinnedMesh}
      />
    </group>
  )
} 