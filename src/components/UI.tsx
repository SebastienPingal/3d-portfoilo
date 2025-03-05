import { Page } from "@/types/pages"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
export const UI = ({ className, pages, targetPage, setTargetPage }: { className?: string, pages: Page[], targetPage: number, setTargetPage: (page: number) => void }) => {
  return (
    <div className={cn("flex gap-2", className)}>
      <Button variant={targetPage === 0 ? "default" : "outline"} onClick={() => setTargetPage(0)}>
        Première de couverture
      </Button>
      {pages.map((page, index) => (
        <Button variant={targetPage === index + 1 ? "default" : "outline"} key={index} onClick={() => setTargetPage(index + 1)}>{page.contentFront?.title}</Button>
      ))}
      <Button variant={targetPage === pages.length + 1 ? "default" : "outline"} onClick={() => setTargetPage(pages.length + 1)}>
        Dos de dernière page
      </Button>
      <Button variant={targetPage === pages.length + 2 ? "default" : "outline"} onClick={() => setTargetPage(pages.length + 2)}>
        4eme de couverture
      </Button>
    </div>
  )
}