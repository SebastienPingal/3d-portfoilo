'use client'
import { Page as PageType } from "@/types/pages"
import { ThreeElements } from "@react-three/fiber"
import { Page, PAGE_DEPTH } from "./Page"
import { useEffect, useState } from "react"
import { BookCover, COVER_DEPTH } from "./BookCover"

export const Book = ({ pages, targetPage, setTargetPage, ...props }: { pages: PageType[], targetPage: number, setTargetPage: (page: number) => void } & ThreeElements['group']) => {
  const [delayedPage, setDelayedPage] = useState(targetPage)

  useEffect(() => {
    // If we're already at the target, nothing to do
    if (targetPage === delayedPage) return
    
    // Calculate next page
    const nextPage = targetPage > delayedPage ? delayedPage + 1 : delayedPage - 1
    
    // Special check for cover closing movements
    const isClosingCover =
      (nextPage === 0 && delayedPage === 1) ||
      (nextPage === pages.length + 2 && delayedPage === pages.length + 1)
    
    const delay = isClosingCover ? 500 : 150
    
    // Schedule the state update after the appropriate delay
    const timeout = setTimeout(() => {
      setDelayedPage(nextPage)
    }, delay)
    
    return () => {
      clearTimeout(timeout)
    }
  }, [targetPage, delayedPage, pages.length])

  const bookClosed = delayedPage === 0 || delayedPage === pages.length + 2
  const lastPage = delayedPage === pages.length + 2

  return (
    <group {...props}>
      <BookCover
        lastPage={lastPage}
        bookClosed={bookClosed}
        position-x={COVER_DEPTH / 2}
        position-z={COVER_DEPTH / 2}
        pages={pages}
        setTargetPage={setTargetPage}
        targetPage={targetPage}
      />
      {pages.map((page, index) => (
        <Page
          key={index}
          page={page}
          opened={delayedPage > index + 1}
          number={index + 1}
          bookClosed={bookClosed}
          setTargetPage={setTargetPage}
        />
      ))}
      <BookCover
        isBack
        lastPage={lastPage}
        bookClosed={bookClosed}
        position-x={-PAGE_DEPTH * (pages.length - 1) - COVER_DEPTH / 2}
        position-z={COVER_DEPTH / 2}
        pages={pages}
        setTargetPage={setTargetPage}
        targetPage={targetPage}
      />
    </group>
  )
}