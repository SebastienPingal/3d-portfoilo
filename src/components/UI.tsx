import { Page } from "@/types/pages"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
export const UI = ({ className, pages, currentPage, setCurrentPage }: { className?: string, pages: Page[], currentPage: number, setCurrentPage: (page: number) => void }) => {
  return (
    <div className={cn("flex gap-2", className)}>
      {pages.map((page, index) => (
        <Button variant={currentPage === index ? "default" : "outline"} key={index} onClick={() => setCurrentPage(index)}>{page.contentFront.title}</Button>
      ))}
      <Button variant="outline" onClick={() => setCurrentPage(pages.length)}>Last Page</Button>
    </div>
  )
}