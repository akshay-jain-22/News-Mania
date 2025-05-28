import { GrokConnectionTest } from "@/components/grok-connection-test"

export default function FactCheckPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Fact Check</h1>

      <div className="mb-8">
        <GrokConnectionTest />
      </div>

      <p className="mb-4">This is a simple fact-checking page. You can use it to verify the accuracy of information.</p>
      {/* Add more content here as needed */}
    </div>
  )
}
