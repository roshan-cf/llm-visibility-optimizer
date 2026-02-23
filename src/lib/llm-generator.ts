import { config } from "./config";

interface LlmsTxtInput {
  domain: string;
  homepageContent: string;
  productCategories: string[];
  brandName: string;
  keyPages: { title: string; url: string }[];
}

interface LlmsTxtResult {
  content: string;
  usedLLM: boolean;
  error?: string;
}

export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${config.ollama.url}/api/tags`, {
      method: "GET",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export async function generateLlmsTxtWithLLM(input: LlmsTxtInput): Promise<LlmsTxtResult> {
  const prompt = `You are generating an llms.txt file for an e-commerce website. This file helps LLMs understand the website structure and content.

Website: ${input.domain}
Brand: ${input.brandName}

Homepage content excerpt:
${input.homepageContent.slice(0, 2000)}

Product categories:
${input.productCategories.length > 0 ? input.productCategories.join("\n") : "Not detected"}

Key pages:
${input.keyPages.map(p => `- ${p.title}: ${p.url}`).join("\n")}

Generate a concise llms.txt file in this EXACT format. Do not add any commentary, just the llms.txt content:

# ${input.brandName || input.domain}

> {One-line tagline describing what the brand sells - extract from homepage content}

## Products
{List main product categories, one per line starting with -}

## Key Pages
{List 3-5 important pages in format: [Page Title](full-url)}

## About
{2-3 sentences about the brand, what makes them unique, extracted from homepage}

## Sitemap
https://${input.domain}/sitemap.xml

Now generate the llms.txt content:`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.ollama.timeout);
    
    const response = await fetch(`${config.ollama.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.ollama.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 1000
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.response?.trim();
    
    if (!content || content.length < 50) {
      throw new Error("LLM response too short or empty");
    }
    
    return { content, usedLLM: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Ollama error:", errorMessage);
    return { content: "", usedLLM: false, error: errorMessage };
  }
}

export function parseLlmsTxtSections(content: string): {
  tagline: string;
  products: string[];
  categories: string[];
  about: string;
  keyPages: { title: string; url: string }[];
  sitemap: string;
} {
  const sections = {
    tagline: "",
    products: [] as string[],
    categories: [] as string[],
    about: "",
    keyPages: [] as { title: string; url: string }[],
    sitemap: ""
  };
  
  const lines = content.split("\n");
  let currentSection = "";
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith("> ")) {
      sections.tagline = trimmed.slice(2);
    } else if (trimmed.startsWith("## Products")) {
      currentSection = "products";
    } else if (trimmed.startsWith("## Categories") || trimmed.startsWith("## Product Categories")) {
      currentSection = "categories";
    } else if (trimmed.startsWith("## Key Pages") || trimmed.startsWith("## Important Pages")) {
      currentSection = "keyPages";
    } else if (trimmed.startsWith("## About")) {
      currentSection = "about";
    } else if (trimmed.startsWith("## Sitemap")) {
      currentSection = "sitemap";
    } else if (trimmed.startsWith("## ")) {
      currentSection = "";
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const item = trimmed.slice(2);
      if (currentSection === "products") {
        sections.products.push(item);
      } else if (currentSection === "categories") {
        sections.categories.push(item);
      }
    } else if (trimmed.startsWith("[") && trimmed.includes("](")) {
      const match = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match && currentSection === "keyPages") {
        sections.keyPages.push({ title: match[1], url: match[2] });
      }
    } else if (trimmed.startsWith("http") && currentSection === "sitemap") {
      sections.sitemap = trimmed;
    } else if (trimmed && currentSection === "about") {
      sections.about += (sections.about ? " " : "") + trimmed;
    }
  }
  
  return sections;
}
