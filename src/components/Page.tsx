import { Page as PageType } from "@/types/pages"
import { useCursor, useTexture } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"
import { Bone, BoxGeometry, Color, Float32BufferAttribute, Group, MeshStandardMaterial, Skeleton, SkinnedMesh, SRGBColorSpace, Uint16BufferAttribute, Vector3 } from "three"
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

export const PAGE_WIDTH = 1.28
export const PAGE_HEIGHT = 1.71
export const PAGE_DEPTH = 0.014
export const PAGE_SEGMENTS = 30
export const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS


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

const whiteColor = new Color("white")
const emissiveColor = new Color("orange")

const pageMaterials = [
  new MeshStandardMaterial({ color: "white" }),
  new MeshStandardMaterial({ color: "white" }),
  new MeshStandardMaterial({ color: "white" }),
  new MeshStandardMaterial({ color: "white" }),
]

export const Page = ({ page, number, opened, bookClosed, setTargetPage, ...props }: { page: PageType, number: number, opened: boolean, bookClosed: boolean, setTargetPage: (page: number) => void } & ThreeElements['group']) => {
  const texturePaths = [
    page.contentFront.image,
    page.contentBack.image,
    page.contentFront.imageRoughness,
    page.contentBack.imageRoughness
  ].filter(Boolean) as string[]

  const textures = useTexture(texturePaths)

  const front = page.contentFront.image ? textures[0] : null
  const back = page.contentBack.image ? textures[texturePaths.indexOf(page.contentBack.image)] : null
  const frontRoughness = page.contentFront.imageRoughness ? textures[texturePaths.indexOf(page.contentFront.imageRoughness)] : null
  const backRoughness = page.contentBack.imageRoughness ? textures[texturePaths.indexOf(page.contentBack.imageRoughness)] : null

  if (front) front.colorSpace = SRGBColorSpace
  if (back) back.colorSpace = SRGBColorSpace

  const group = useRef<Group>(null)
  const turnedAt = useRef<number>(0)
  const lastOpened = useRef<boolean>(opened)
  const skinnedMesh = useRef<SkinnedMesh>(null)

  const manualSkinnedMesh = useMemo(() => {
    const bones = []

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
    const skeleton = new Skeleton(bones)

    const materials = [...pageMaterials,
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
    const mesh = new SkinnedMesh(pageGeometry, materials)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    mesh.add(skeleton.bones[0])
    mesh.bind(skeleton)
    return mesh
  }, [front, back, frontRoughness, backRoughness])

  useFrame((_, delta) => {
    if (!skinnedMesh.current) return

    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(turningPageTime, +new Date() - turnedAt.current) / turningPageTime;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? openAngle : closeAngle
    if (!bookClosed) {
      targetRotation += degToRad((number - 1) * 0.9)
    }

    const emissiveIntensity = highlighted ? 0.08 : 0
    const materials = skinnedMesh.current.material as MeshStandardMaterial[]
    materials[4].emissiveIntensity =
      materials[5].emissiveIntensity = MathUtils.lerp(
        materials[4].emissiveIntensity, emissiveIntensity, 0.1
      )

    const bones = skinnedMesh.current.skeleton.bones
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i]

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 - 0.9) : 0
      const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime

      let rotationAngle =
        insideCurveIntensity * insideCurveStrength * targetRotation -
        outsideCurveIntensity * outsideCurveStrength * targetRotation +
        turningIntensity * turningCurveStrength * targetRotation

      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2)

      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation
          foldRotationAngle = 0
        } else {
          rotationAngle = 0
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
        setTargetPage(opened ? number : number + 1)
        setHighlighted(false)
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        position-z={-(number - 1) * PAGE_DEPTH - 0.01}
        ref={skinnedMesh}
      />
    </group>
  )
} 