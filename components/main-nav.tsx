"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <nav className={cn("hidden md:flex items-center gap-6", className)}>
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          "h-auto px-3 py-2 text-sm font-medium",
        )}
      >
        {t("nav.dashboard")}
      </Link>
      <Link
        href="/topics"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          pathname === "/topics" || pathname.startsWith("/topics/")
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground",
          "h-auto px-3 py-2 text-sm font-medium",
        )}
      >
        {t("nav.topics")}
      </Link>
      <Link
        href="/fact-check"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          pathname === "/fact-check" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          "h-auto px-3 py-2 text-sm font-medium",
        )}
      >
        {t("nav.factCheck")}
      </Link>
      <Link
        href="/notes"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          pathname === "/notes" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          "h-auto px-3 py-2 text-sm font-medium",
        )}
      >
        {t("nav.myNotes")}
      </Link>
      <Link
        href="/extract"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          pathname === "/extract" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          "h-auto px-3 py-2 text-sm font-medium",
        )}
      >
        {t("nav.extract")}
      </Link>
    </nav>
  )
}
