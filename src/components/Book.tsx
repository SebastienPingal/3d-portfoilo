'use client'
import { Page as PageType } from "@/types/pages"
import { ThreeElements } from "@react-three/fiber"
import { Page } from "./Page"
import { useEffect, useState } from "react"

export const Book = ({ pages, targetPage, setTargetPage, ...props }: { pages: PageType[], targetPage: number, setTargetPage: (page: number) => void } & ThreeElements['group']) => {
  const [delayedPage, setDelayedPage] = useState(targetPage)

  useEffect(() => {
    // If we're already at the target, nothing to do
    if (targetPage === delayedPage) return

    // Calculate next page
    const nextPage = targetPage > delayedPage ? delayedPage + 1 : delayedPage - 1

    // Special check for cover closing movements
    const isCoverMoving =
      (nextPage === 0 && delayedPage === 1) ||
      (nextPage === pages.length + 2 && delayedPage === pages.length + 1) ||
      (nextPage === 2 && delayedPage === 1) ||
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

  return (
    <group {...props}>
      <Page
        key="front-cover"
        page={{} as PageType}
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
          numberOfPages={pages.length}
          opened={delayedPage > index + 1}
          number={index + 1}
          bookClosed={bookClosed}
          setTargetPage={setTargetPage}
        />
      ))}
      <Page
        key="back-cover"
        page={{} as PageType}
        numberOfPages={pages.length}
        opened={delayedPage > pages.length + 1}
        number={pages.length + 1}
        bookClosed={bookClosed}
        setTargetPage={setTargetPage}
        isCover={true}
        isFront={false}
      />
    </group>
  )
}