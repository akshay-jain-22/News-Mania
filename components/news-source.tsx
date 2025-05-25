"use client"

import { cn } from "@/lib/utils"

interface NewsSourceProps {
  name: string
  active?: boolean
  onClick?: () => void
}

export function NewsSource({ name, active = false, onClick }: NewsSourceProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      )}
      onClick={onClick}
    >
      {name}
    </button>
  )
}
