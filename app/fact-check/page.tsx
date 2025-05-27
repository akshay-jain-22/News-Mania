import { QuickCredibilityCheck } from "@/components/quick-credibility-check"

export default function FactCheckPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Fact Check</h1>
      <p className="mb-4">Enter a claim or statement to quickly assess its credibility.</p>

      <div className="mb-8">
        <QuickCredibilityCheck />
      </div>
    </div>
  )
}
