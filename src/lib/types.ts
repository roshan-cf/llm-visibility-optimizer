export interface PageAnalysis {
  url: string;
  title: string;
  metaDescription: string;
  jsonLdScripts: unknown[];
  openGraph: Record<string, string>;
  headings: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
  h1Texts: string[];
  images: { total: number; withAlt: number; withoutAlt: number };
  semanticElements: Record<string, number>;
  wordCount: number;
  schemas: {
    hasProductSchema: boolean;
    hasOrganizationSchema: boolean;
    hasFAQSchema: boolean;
    hasBreadcrumbSchema: boolean;
    hasReviewSchema: boolean;
    hasAggregateRating: boolean;
    hasArticleSchema: boolean;
    hasAuthorSchema: boolean;
  };
  reviews: {
    hasReviews: boolean;
    reviewCount: number;
    averageRating: number | null;
    ratingCount: number;
  };
  quoteReadySnippets: string[];
  freshness: {
    publishedDate: string | null;
    modifiedDate: string | null;
    daysSinceUpdate: number | null;
    freshnessScore: number;
    status: "fresh" | "stale" | "unknown";
  };
  author: {
    hasAuthor: boolean;
    authorName: string | null;
    authorType: string | null;
    hasCredentials: boolean;
    hasBio: boolean;
  };
  score: number;
  scoreBreakdown?: PageScoreBreakdown;
  links: string[];
}

export interface PageScoreBreakdown {
  critical: {
    productSchema: { points: number; max: number; present: boolean };
    organizationSchema: { points: number; max: number; present: boolean };
  };
  important: {
    reviews: { points: number; max: number; present: boolean };
    faq: { points: number; max: number; present: boolean };
    author: { points: number; max: number; present: boolean };
    freshness: { points: number; max: number; status: string };
  };
  basic: {
    metaDescription: { points: number; max: number; length: number };
    h1Structure: { points: number; max: number; count: number };
    imageAlt: { points: number; max: number; coverage: number };
  };
  enhancements: {
    anySchema: { points: number; max: number; present: boolean };
    openGraph: { points: number; max: number; count: number };
    wordCount: { points: number; max: number; count: number };
  };
  penalties: {
    noSchema: { points: number; reason: string };
    shortMeta: { points: number; reason: string };
    missingH1: { points: number; reason: string };
    multipleH1: { points: number; reason: string };
  };
}

export interface SiteAnalysis {
  mainUrl: string;
  domain: string;
  robotsTxt: string | null;
  sitemap: string | null;
  sitemapUrls: string[];
  llmsTxt: string | null;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasLlmsTxt: boolean;
  pagesAnalyzed: number;
  totalPages: number;
  pages: PageAnalysis[];
  aggregateScore: number;
  aggregateScoreBreakdown?: AggregateScoreBreakdown;
  aggregateFactors: {
    name: string;
    score: number;
    status: "good" | "warning" | "poor";
    details: string;
  }[];
  aggregateRecommendations: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    affectedPages: number;
  }[];
  schemaCoverage: {
    productPages: number;
    organizationPages: number;
    faqPages: number;
    breadcrumbPages: number;
    reviewPages: number;
    aggregateRatingPages: number;
    pagesWithSchema: number;
    pagesWithoutSchema: number;
  };
  llmDiscoveryPrompts: {
    category: string;
    prompts: string[];
    likelihood: "high" | "medium" | "low";
  }[];
  generatedArtifacts?: GeneratedArtifacts;
}

export interface AggregateScoreBreakdown {
  productSchema: { score: number; weight: number; pages: number };
  organizationSchema: { score: number; weight: number; present: boolean };
  reviewSchema: { score: number; weight: number; pages: number };
  llmsTxt: { score: number; weight: number; present: boolean };
  schemaCoverage: { score: number; weight: number; percentage: number };
  metaDescriptions: { score: number; weight: number; percentage: number };
  headingStructure: { score: number; weight: number; percentage: number };
  imageAlt: { score: number; weight: number; percentage: number };
  robotsTxt: { score: number; weight: number; present: boolean };
  sitemap: { score: number; weight: number; present: boolean };
  ogTags: { score: number; weight: number; percentage: number };
}

export interface GeneratedArtifacts {
  llmsTxt: GeneratedLlmsTxt;
  homepageSchemas: GeneratedSchema[];
  productSchemas: GeneratedSchema[];
  organizationSchema: GeneratedSchema | null;
}

export interface GeneratedLlmsTxt {
  content: string;
  sections: {
    tagline: string;
    products: string[];
    categories: string[];
    about: string;
    keyPages: { title: string; url: string }[];
    sitemap: string;
  };
  warnings: string[];
  confidence: "high" | "medium" | "low";
}

export interface GeneratedSchema {
  type: "Product" | "Organization" | "FAQPage" | "BreadcrumbList";
  jsonLd: object;
  jsonString: string;
  confidence: "high" | "medium" | "low";
  fieldsExtracted: string[];
  fieldsMissing: string[];
  suggestions: string[];
  sourceUrl: string;
}

export type AnalysisResult = SiteAnalysis;
