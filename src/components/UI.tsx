import { useEffect } from "react";

export const UI = ({ currentPage, setCurrentPage }: { currentPage: number, setCurrentPage: (page: number) => void }) => {
  return (
    <div>
      <h1>Current Page: {currentPage}</h1>
    </div>
  )
}