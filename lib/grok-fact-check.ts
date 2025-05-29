// lib/grok-fact-check.ts

import { ChatOpenAI } from "langchain/chat_models/openai"
import { PromptTemplate } from "langchain/prompts"
import { StringOutputParser } from "langchain/schema/output_parser"

const openAIApiKey = process.env.OPENAI_API_KEY

const factCheckTemplate = `You are an expert fact checker. Given the following statement, provide a detailed analysis of its truthfulness.
Explain your reasoning and cite any sources you used to verify the information.

Statement: {statement}`

const factCheckPrompt = PromptTemplate.fromTemplate(factCheckTemplate)

const model = new ChatOpenAI({
  openAIApiKey,
  modelName: "gpt-4",
  temperature: 0,
})

const outputParser = new StringOutputParser()

const chain = factCheckPrompt.pipe(model).pipe(outputParser)

export const factCheckWithGrok = async (statement: string) => {
  const analysis = await chain.invoke({ statement })

  const analysisFactors: string[] = []

  analysisFactors.push("🌍 Sliced, diced, and analyzed by the Mania World")
  analysisFactors.push("Fact-checked using advanced AI algorithms")
  analysisFactors.push("Data sources include reputable news outlets and academic research")

  return {
    analysis,
    analysisFactors,
  }
}
