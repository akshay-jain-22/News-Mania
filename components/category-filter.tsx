"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"
import { SUPPORTED_CATEGORIES } from "@/lib/fetchNewsData"
import { useI18n } from "@/lib/i18n"

interface CategoryFilterProps {
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
  multiSelect?: boolean
}

export function CategoryFilter({ selectedCategories, onCategoriesChange, multiSelect = true }: CategoryFilterProps) {
  const { t } = useI18n()

  const handleCategoryToggle = (category: string) => {
    if (multiSelect) {
      if (selectedCategories.includes(category)) {
        onCategoriesChange(selectedCategories.filter((c) => c !== category))
      } else {
        onCategoriesChange([...selectedCategories, category])
      }
    } else {
      onCategoriesChange([category])
    }
  }

  const clearCategories = () => {
    onCategoriesChange([])
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            {t("categories")}
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedCategories.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
          {SUPPORTED_CATEGORIES.map((category) => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={selectedCategories.includes(category)}
              onCheckedChange={() => handleCategoryToggle(category)}
            >
              {t(`category.${category}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedCategories.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1">
            {selectedCategories.slice(0, 3).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {t(`category.${category}`)}
              </Badge>
            ))}
            {selectedCategories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedCategories.length - 3}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearCategories}>
            {t("clear")}
          </Button>
        </>
      )}
    </div>
  )
}
