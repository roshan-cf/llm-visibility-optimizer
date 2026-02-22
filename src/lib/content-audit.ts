export interface ContentAuditResult {
  wordCount: number;
  readingTime: number;
  headingStructure: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    issues: string[];
  };
  readability: {
    score: number;
    level: "Easy" | "Medium" | "Difficult";
    recommendation: string;
  };
  contentGaps: string[];
  strengths: string[];
  recommendations: string[];
  overallScore: number;
}

export function auditContent(
  bodyText: string,
  headings: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number },
  metaDescription: string,
  title: string
): ContentAuditResult {
  const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const headingIssues: string[] = [];
  if (headings.h1 === 0) {
    headingIssues.push("Missing H1 tag - every page needs a main heading");
  } else if (headings.h1 > 1) {
    headingIssues.push(`Multiple H1 tags (${headings.h1}) - use only one H1 per page`);
  }

  if (headings.h1 > 0 && headings.h2 === 0) {
    headingIssues.push("No H2 tags found - add subheadings to organize content");
  }

  const totalHeadings = Object.values(headings).reduce((a, b) => a + b, 0);
  if (wordCount > 300 && totalHeadings < 3) {
    headingIssues.push("Consider adding more headings to break up long content");
  }

  const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    : 0;

  const readabilityScore = calculateReadabilityScore(bodyText, avgSentenceLength);
  const readabilityLevel = getReadabilityLevel(readabilityScore);

  const contentGaps: string[] = [];
  if (wordCount < 300) {
    contentGaps.push("Content is too thin - aim for at least 300 words");
  }
  if (!metaDescription || metaDescription.length < 50) {
    contentGaps.push("Missing or inadequate meta description");
  }
  if (!title || title.length < 30) {
    contentGaps.push("Title is too short or missing");
  }
  const lowerText = bodyText.toLowerCase();
  const hasCallToAction = /(?:buy|shop|order|contact|subscribe|learn more|get started|sign up)/i.test(bodyText);
  if (!hasCallToAction && wordCount > 200) {
    contentGaps.push("No clear call-to-action detected");
  }

  const strengths: string[] = [];
  if (wordCount >= 500) {
    strengths.push("Good content depth");
  }
  if (headings.h1 === 1 && headings.h2 >= 2) {
    strengths.push("Well-structured heading hierarchy");
  }
  if (readabilityScore >= 60) {
    strengths.push("Content is easy to read");
  }
  if (metaDescription && metaDescription.length >= 120) {
    strengths.push("Comprehensive meta description");
  }

  const recommendations: string[] = [];
  
  if (wordCount < 500) {
    recommendations.push("Expand content to provide more value and context for LLMs");
  }
  
  if (avgSentenceLength > 25) {
    recommendations.push("Shorten sentences for better readability");
  }
  
  if (!lowerText.includes("?")) {
    recommendations.push("Add FAQs or Q&A sections to address user questions");
  }

  recommendations.push("Include specific details like prices, specifications, or comparisons");
  recommendations.push("Add structured data to help LLMs extract key information");

  const overallScore = calculateOverallScore(
    wordCount,
    headingIssues.length,
    readabilityScore,
    contentGaps.length,
    strengths.length
  );

  return {
    wordCount,
    readingTime,
    headingStructure: {
      ...headings,
      issues: headingIssues,
    },
    readability: {
      score: readabilityScore,
      level: readabilityLevel,
      recommendation: getReadabilityRecommendation(readabilityScore),
    },
    contentGaps,
    strengths,
    recommendations,
    overallScore,
  };
}

function calculateReadabilityScore(text: string, avgSentenceLength: number): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const syllablesPerWord = words.length > 0 ? syllableCount / words.length : 0;

  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * syllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(fleschScore)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function getReadabilityLevel(score: number): "Easy" | "Medium" | "Difficult" {
  if (score >= 60) return "Easy";
  if (score >= 40) return "Medium";
  return "Difficult";
}

function getReadabilityRecommendation(score: number): string {
  if (score >= 60) {
    return "Your content is easy to read. Great for both users and LLMs!";
  }
  if (score >= 40) {
    return "Consider simplifying sentences and using shorter words.";
  }
  return "Content is difficult to read. Shorten sentences and use simpler vocabulary.";
}

function calculateOverallScore(
  wordCount: number,
  headingIssues: number,
  readabilityScore: number,
  contentGaps: number,
  strengths: number
): number {
  let score = 50;

  if (wordCount >= 300) score += 10;
  if (wordCount >= 500) score += 10;
  if (wordCount >= 1000) score += 5;

  score -= headingIssues * 5;
  score += Math.min(15, readabilityScore / 10);
  score -= contentGaps * 5;
  score += strengths * 5;

  return Math.max(0, Math.min(100, score));
}
