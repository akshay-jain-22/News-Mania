import { Loader2, Brain } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <Brain className="h-16 w-16 animate-pulse mx-auto mb-4 text-purple-500" />
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">AI is Learning Your Preferences</h2>
        <p className="text-gray-400">Personalizing your news feed using machine learning...</p>
      </div>
    </div>
  )
}
