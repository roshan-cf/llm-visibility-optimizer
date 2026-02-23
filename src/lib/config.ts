export const config = {
  ollama: {
    url: process.env.OLLAMA_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
    timeout: 30000
  },
  analysis: {
    maxPages: parseInt(process.env.MAX_PAGES || "100"),
    fetchTimeout: parseInt(process.env.FETCH_TIMEOUT || "15000")
  }
};
