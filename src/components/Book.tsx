'use client'
import { Page as PageType } from "@/types/pages"
import { ThreeElements } from "@react-three/fiber"
import { Page, PAGE_DEPTH } from "./Page"
import { useEffect, useState } from "react"
import { BookCover, COVER_DEPTH } from "./BookCover"

export const Book = ({ pages, currentPage, setCurrentPage, ...props }: { pages: PageType[], currentPage: number, setCurrentPage: (page: number) => void } & ThreeElements['group']) => {
  const [delayedPage, setDelayedPage] = useState(currentPage)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const goToPage = () => {
      setDelayedPage((delayedPage: number) => {
        if (currentPage === delayedPage) {
          return delayedPage
        } else {
          timeout = setTimeout(() => {
            goToPage()
          },
            Math.abs(currentPage - delayedPage) > 2 ? 50 : 150
          )
          if (currentPage > delayedPage) {
            return delayedPage + 1
          }
          if (currentPage < delayedPage) {
            return delayedPage - 1
          }
          return delayedPage
        }
      })
    }
    goToPage()
    return () => {
      clearTimeout(timeout)
    }
  }, [currentPage])

  const bookClosed = delayedPage === 0 || delayedPage === pages.length

  return (
    <group {...props}>
      <BookCover
        lastPage={delayedPage === pages.length}
        bookClosed={bookClosed}
        position-x={COVER_DEPTH / 2}
        position-z={COVER_DEPTH / 2}
        pages={pages}
      />
      {pages.map((page, index) => (
        <Page
          key={index}
          page={page}
          currentPage={delayedPage}
          opened={delayedPage > index}
          number={index}
          bookClosed={bookClosed}
          setCurrentPage={setCurrentPage}
        />
      ))}
      <BookCover
        isBack
        lastPage={delayedPage === pages.length}
        bookClosed={bookClosed}
        position-x={-PAGE_DEPTH * (pages.length - 1) - COVER_DEPTH / 2}
        position-z={COVER_DEPTH / 2}
        pages={pages}
      />
    </group>
  )
}