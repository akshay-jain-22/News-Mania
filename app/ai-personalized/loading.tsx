import { Loader2, Brain } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Brain className="h-16 w-16 animate-pulse mx-auto mb-4 text-purple-500" />
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">AI is Learning...</h2>
            <p className="text-gray-400">Personalizing your news experience</p>
          </div>
        </div>
      </div>
    </div>
  )
}
