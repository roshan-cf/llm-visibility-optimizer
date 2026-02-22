export interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface Factor {
  name: string;
  score: number;
  status: "good" | "warning" | "poor";
}

export interface AnalysisResult {
  score: number;
  recommendations: Recommendation[];
  factors: Factor[];
}

export async function analyzeWebsite(url: string): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const factors: Factor[] = [
    { name: "Structured Data", score: 45, status: "warning" },
    { name: "Meta Descriptions", score: 80, status: "good" },
    { name: "Product Schema", score: 30, status: "poor" },
    { name: "Semantic HTML", score: 65, status: "warning" },
    { name: "Open Graph Tags", score: 75, status: "good" },
    { name: " robots.txt", score: 90, status: "good" },
    { name: "Sitemap", score: 60, status: "warning" },
    { name: "Page Speed", score: 55, status: "warning" },
  ];

  const recommendations: Recommendation[] = [
    {
      title: "Add Product Schema Markup",
      description: "Implement JSON-LD structured data for products to help LLMs understand your product catalog.",
      priority: "high",
    },
    {
      title: "Improve Semantic HTML Structure",
      description: "Use proper heading hierarchy (h1-h6), article tags, and section elements for better content parsing.",
      priority: "medium",
    },
    {
      title: "Add FAQ Schema",
      description: "Include FAQ structured data to increase chances of appearing in AI-generated answers.",
      priority: "medium",
    },
    {
      title: "Optimize Meta Descriptions",
      description: "Write clear, concise meta descriptions that accurately describe page content.",
      priority: "low",
    },
    {
      title: "Create Detailed Product Descriptions",
      description: "LLMs favor pages with comprehensive, well-structured product information.",
      priority: "high",
    },
  ];

  const avgScore = Math.round(
    factors.reduce((sum, f) => sum + f.score, 0) / factors.length
  );

  return {
    score: avgScore,
    recommendations,
    factors,
  };
}
