import { Page as PageType } from "@/types/pages"
import { useTexture } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { Bone, BoxGeometry, Color, Float32BufferAttribute, Group, MeshStandardMaterial, Skeleton, SkinnedMesh, SRGBColorSpace, Uint16BufferAttribute, Vector3 } from "three"
const PAGE_WIDTH = 1.28
const PAGE_HEIGHT = 1.71
const PAGE_DEPTH = 0.003
const PAGE_SEGMENTS = 30
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS

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
  vertex.fromBufferAttribute(position, i) // get the vertex position
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

const pageMaterials = [
  new MeshStandardMaterial({ color: "red" }),
  new MeshStandardMaterial({ color: "blue" }),
  new MeshStandardMaterial({ color: "green" }),
  new MeshStandardMaterial({ color: "yellow" }),
]


export const Page = ({ page, number, currentPage, opened, ...props }: { page: PageType, number: number, currentPage: number, opened: boolean } & ThreeElements['group']) => {
  // Only load textures that actually exist
  const texturePaths = [
    page.contentFront.image,
    page.contentBack.image,
    page.contentFront.imageRoughness,
    page.contentBack.imageRoughness
  ].filter(Boolean) as string[]

  const textures = useTexture(texturePaths)
  const group = useRef<Group>(null)

  // Get textures safely or use null as fallback
  const front = page.contentFront.image ? textures[0] : null
  const back = page.contentBack.image ? textures[texturePaths.indexOf(page.contentBack.image)] : null
  const frontRoughness = page.contentFront.imageRoughness ? textures[texturePaths.indexOf(page.contentFront.imageRoughness)] : null
  const backRoughness = page.contentBack.imageRoughness ? textures[texturePaths.indexOf(page.contentBack.imageRoughness)] : null

  // Only set colorSpace if textures exist
  if (front) front.colorSpace = SRGBColorSpace
  if (back) back.colorSpace = SRGBColorSpace

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
    }),
    new MeshStandardMaterial({
      color: whiteColor,
      map: back,
      roughnessMap: backRoughness,
      roughness: 0.8,
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


  useFrame(() => {
    if (!skinnedMesh.current) return

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2

    const bones = skinnedMesh.current.skeleton.bones
    bones[0].rotation.y = targetRotation
  })

  return (
    <group ref={group} {...props}>
      <primitive
        object={manualSkinnedMesh}
        position-z={-number * PAGE_DEPTH + currentPage * PAGE_DEPTH *10}
        ref={skinnedMesh} />
    </group>
  )
}
export const Book = ({ pages, currentPage, ...props }: { pages: PageType[], currentPage: number } & ThreeElements['group']) => {
  return (
    <group {...props}>
      {pages.map((page, index) => (
        <Page
          key={index}
          page={page}
          currentPage={currentPage}
          opened={currentPage > index}
          number={index}
        />
      ))}
    </group>
  )
}