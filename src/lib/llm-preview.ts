export interface LLMSummary {
  title: string;
  description: string;
  mainContent: string[];
  products: string[];
  keyPoints: string[];
  suggestedPrompt: string;
}

export function generateLLMSummary(
  title: string,
  metaDescription: string,
  h1Texts: string[],
  bodyText: string,
  url: string
): LLMSummary {
  const sentences = bodyText
    .replace(/\s+/g, " ")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 200)
    .slice(0, 10);

  const productPatterns = [
    /\b\d+\s*(?:products?|items?)/gi,
    /\$(?:\d+,?)+\.?\d*/g,
    /\b(?:buy|shop|cart|checkout|price|sale|discount)\b/gi,
  ];

  const hasProducts = productPatterns.some((p) => p.test(bodyText));

  const mainContent = sentences.slice(0, 5);

  const keyPoints: string[] = [];
  
  if (title) {
    keyPoints.push(`Page title: "${title}"`);
  }
  
  if (metaDescription) {
    keyPoints.push(`Meta description provides: "${metaDescription.slice(0, 100)}..."`);
  }
  
  if (h1Texts.length > 0) {
    keyPoints.push(`Main heading: "${h1Texts[0]}"`);
  }

  if (hasProducts) {
    keyPoints.push("This appears to be a product/e-commerce page");
  }

  const products: string[] = [];
  if (hasProducts) {
    products.push("Product information detected but structured data recommended for better LLM understanding");
  }

  let description = "";
  if (title && metaDescription) {
    description = `${title} - ${metaDescription}`;
  } else if (title) {
    description = title;
  } else {
    description = "Unable to generate a clear description. Consider adding a title tag and meta description.";
  }

  const suggestedPrompt = generateSuggestedPrompt(title, hasProducts, url);

  return {
    title: title || "No title found",
    description,
    mainContent,
    products,
    keyPoints,
    suggestedPrompt,
  };
}

function generateSuggestedPrompt(title: string, hasProducts: boolean, url: string): string {
  const domain = new URL(url).hostname.replace("www.", "");
  
  if (hasProducts) {
    return `What products does ${domain} offer? List their main product categories and any current promotions.`;
  }
  
  return `What is ${domain}? Provide a summary of their business and what they offer.`;
}

export function estimateLLMVisibility(
  title: string,
  metaDescription: string,
  hasSchema: boolean,
  wordCount: number,
  headingCount: number
): {
  score: number;
  factors: string[];
  improvements: string[];
} {
  let score = 0;
  const factors: string[] = [];
  const improvements: string[] = [];

  if (title && title.length > 10) {
    score += 15;
    factors.push("Clear page title");
  } else {
    improvements.push("Add a descriptive page title");
  }

  if (metaDescription && metaDescription.length >= 120) {
    score += 15;
    factors.push("Comprehensive meta description");
  } else {
    improvements.push("Add or improve meta description (120-160 characters)");
  }

  if (hasSchema) {
    score += 25;
    factors.push("Structured data present");
  } else {
    improvements.push("Add JSON-LD structured data");
  }

  if (wordCount >= 300) {
    score += 15;
    factors.push("Sufficient content depth");
  } else {
    improvements.push("Add more content (aim for 300+ words)");
  }

  if (headingCount >= 3) {
    score += 15;
    factors.push("Good heading structure");
  } else {
    improvements.push("Add more headings for content organization");
  }

  score += 15;

  return {
    score: Math.min(100, score),
    factors,
    improvements,
  };
}
