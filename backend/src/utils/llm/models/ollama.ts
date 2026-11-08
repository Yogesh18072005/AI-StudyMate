import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama'
import { wrapChat } from './util'
import type { MkLLM, MkEmb, EmbeddingsLike } from './types'

export const makeLLM: MkLLM = (cfg: any) => {
  const m = new ChatOllama({
    model: cfg.ollama?.model || 'llama3',
    baseUrl: cfg.ollama?.baseUrl || 'http://localhost:11434',
    temperature: cfg.temp ?? 0.7,
    // Ollama's default output limit is small; allow complete study answers.
    numPredict: Number(process.env.OLLAMA_NUM_PREDICT || 2048),
  })
  return wrapChat(m)
}

export const makeEmbeddings: MkEmb = (cfg: any): EmbeddingsLike => {
  return new OllamaEmbeddings({
    model: cfg.ollama?.embedModel || cfg.ollama?.model || 'llama3',
    baseUrl: cfg.ollama?.baseUrl || 'http://localhost:11434',
  })
}