'use client'
import { Page as PageType } from "@/types/pages"
import { ThreeElements } from "@react-three/fiber"
import { Page } from "./Page"
import { useEffect, useState } from "react"

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

  return (
    <group {...props}>
      {pages.map((page, index) => (
        <Page
          key={index}
          page={page}
          currentPage={delayedPage}
          opened={delayedPage > index}
          number={index}
          bookClosed={delayedPage === 0 || delayedPage === pages.length}
          setCurrentPage={setCurrentPage}
        />
      ))}
    </group>
  )
}