/**
 * LLM Visibility Optimizer - Type Definitions
 * 
 * SCORING PHILOSOPHY:
 * We measure "content extractability" - can an LLM understand your product information?
 * This is different from traditional SEO tools that measure keyword optimization.
 * 
 * KEY INSIGHT:
 * LLMs extract info from schema.org AND from visible content (text, patterns, HTML structure).
 * Sites like Amazon have minimal schema but excellent content extractability.
 * We score based on information presence, not just schema presence.
 */

// ============================================
// PAGE TYPE DETECTION
// ============================================

export type PageType = 
  | "product"      // Individual product page
  | "collection"   // Category/collection listing
  | "blog"         // Blog post/article
  | "homepage"     // Main landing page
  | "search"       // Search results
  | "cart"         // Shopping cart
  | "other";       // Generic page

// ============================================
// CONTENT EXTRACTION DETECTION
// ============================================

export interface ContentExtraction {
  /** Product name extracted from H1, title, og:title, or schema */
  productName: {
    value: string | null;
    source: "schema" | "h1" | "title" | "og" | null;
  };
  
  /** Price extracted from schema or text patterns */
  price: {
    value: number | null;
    currency: string | null;
    source: "schema" | "text" | null;
    rawText: string | null; // e.g., "$1,299" or "₹999"
  };
  
  /** Availability from schema or text patterns */
  availability: {
    status: "in_stock" | "out_of_stock" | "preorder" | "unknown";
    source: "schema" | "text" | null;
    rawText: string | null;
  };
  
  /** Rating from schema or text patterns */
  rating: {
    value: number | null;
    maxRating: number;
    count: number;
    source: "schema" | "text" | null;
    rawText: string | null; // e.g., "★★★★☆ (4.5)"
  };
  
  /** Brand from schema or text */
  brand: {
    value: string | null;
    source: "schema" | "text" | null;
  };
  
  /** Category from schema, breadcrumbs, or URL */
  category: {
    value: string | null;
    source: "schema" | "breadcrumb" | "url" | null;
  };
  
  /** Product specifications detected */
  specifications: {
    detected: boolean;
    count: number;
    source: "table" | "list" | "schema" | null;
  };
  
  /** Images */
  images: {
    count: number;
    hasAlt: number;
    productImages: number; // Images likely to be product images
  };
  
  /** Purchase CTAs detected */
  purchaseCTA: {
    detected: boolean;
    buttons: string[]; // e.g., ["Add to Cart", "Buy Now"]
  };
}

// ============================================
// PAGE SCORE BREAKDOWN (NEW MODEL)
// ============================================

export interface PageScoreBreakdown {
  /** Overall extractability score */
  extractability: {
    score: number;
    max: number;
    label: string; // "Excellent", "Good", "Fair", "Poor"
  };
  
  /** Identity: Can LLM identify WHAT this product is? */
  identity: {
    productName: { 
      points: number; 
      max: number; 
      found: boolean;
      source: string | null;
    };
    description: { 
      points: number; 
      max: number; 
      found: boolean;
      length: number;
    };
    category: { 
      points: number; 
      max: number; 
      found: boolean;
      value: string | null;
    };
  };
  
  /** Pricing: Can LLM find price information? */
  pricing: {
    price: { 
      points: number; 
      max: number; 
      found: boolean;
      value: number | null;
      currency: string | null;
    };
    currency: { 
      points: number; 
      max: number; 
      found: boolean;
      symbol: string | null;
    };
  };
  
  /** Availability: Can LLM know if it's in stock? */
  availability: {
    status: { 
      points: number; 
      max: number; 
      found: boolean;
      value: string | null;
    };
  };
  
  /** Reviews: Can LLM find ratings/reviews? */
  reviews: {
    hasReviews: { 
      points: number; 
      max: number; 
      found: boolean;
    };
    ratingValue: { 
      points: number; 
      max: number; 
      found: boolean;
      value: number | null;
    };
    reviewCount: { 
      points: number; 
      max: number; 
      found: boolean;
      count: number;
    };
  };
  
  /** Specifications: Product details and specs */
  specifications: {
    specsPresent: { 
      points: number; 
      max: number; 
      found: boolean;
      count: number;
    };
    images: { 
      points: number; 
      max: number; 
      count: number;
    };
  };
  
  /** Trust: Brand and purchase path */
  trust: {
    brand: { 
      points: number; 
      max: number; 
      found: boolean;
      value: string | null;
    };
    purchasePath: { 
      points: number; 
      max: number; 
      found: boolean;
      buttons: string[];
    };
  };
  
  /** Schema Bonus: Extra points for using structured data */
  schemaBonus: {
    productSchema: { points: number; max: number; present: boolean };
    aggregateRatingSchema: { points: number; max: number; present: boolean };
    offerSchema: { points: number; max: number; present: boolean };
  };
  
  /** Page type context */
  pageContext: {
    detectedType: PageType;
    isApplicable: boolean; // Is this a page type we can score?
    reason: string | null;
  };
}

// ============================================
// AGGREGATE SCORE BREAKDOWN (NEW MODEL)
// ============================================

export interface AggregateScoreBreakdown {
  /** Core: Product Extractability (35%) */
  productExtractability: { 
    score: number; 
    weight: number; 
    averagePageScore: number;
  };
  
  /** Schema Bonus (15%) */
  schemaBonus: { 
    score: number; 
    weight: number; 
    pagesWithSchema: number;
    totalPages: number;
  };
  
  /** llms.txt presence (10%) */
  llmsTxt: { 
    score: number; 
    weight: number; 
    present: boolean;
  };
  
  /** Internal Linking (10%) */
  internalLinking: { 
    score: number; 
    weight: number;
    averageLinksPerPage: number;
    orphanPages: number;
  };
  
  /** Page Type Coverage (10%) */
  pageTypeCoverage: { 
    score: number; 
    weight: number;
    productPages: number;
    collectionPages: number;
    blogPages: number;
  };
  
  /** robots.txt (5%) */
  robotsTxt: { 
    score: number; 
    weight: number; 
    present: boolean;
  };
  
  /** Sitemap (5%) */
  sitemap: { 
    score: number; 
    weight: number; 
    present: boolean;
  };
  
  /** Content Freshness (5%) */
  contentFreshness: { 
    score: number; 
    weight: number;
    freshPages: number;
    totalPages: number;
  };
  
  /** Brand Consistency (5%) */
  brandConsistency: { 
    score: number; 
    weight: number;
    consistentBrandPages: number;
    totalPages: number;
  };
}

// ============================================
// PAGE ANALYSIS
// ============================================

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
  
  /** Schema detection */
  schemas: {
    hasProductSchema: boolean;
    hasOrganizationSchema: boolean;
    hasFAQSchema: boolean;
    hasBreadcrumbSchema: boolean;
    hasReviewSchema: boolean;
    hasAggregateRating: boolean;
    hasArticleSchema: boolean;
    hasAuthorSchema: boolean;
    hasOfferSchema: boolean;
  };
  
  /** Review data */
  reviews: {
    hasReviews: boolean;
    reviewCount: number;
    averageRating: number | null;
    ratingCount: number;
  };
  
  /** Quote-ready snippets for LLM citation */
  quoteReadySnippets: string[];
  
  /** Content freshness */
  freshness: {
    publishedDate: string | null;
    modifiedDate: string | null;
    daysSinceUpdate: number | null;
    freshnessScore: number;
    status: "fresh" | "stale" | "unknown";
  };
  
  /** Author info (relevant for blog pages) */
  author: {
    hasAuthor: boolean;
    authorName: string | null;
    authorType: string | null;
    hasCredentials: boolean;
    hasBio: boolean;
  };
  
  /** Scores */
  score: number;
  scoreBreakdown?: PageScoreBreakdown;
  
  /** Links */
  links: string[];
  internalLinks: number;
  externalLinks: number;
  
  /** NEW: Content extraction analysis */
  contentExtraction?: ContentExtraction;
  
  /** NEW: Detected page type */
  pageType: PageType;
  
  /** Breadcrumb trail */
  breadcrumbs: string[];
}

// ============================================
// SITE ANALYSIS
// ============================================

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
  
  /** NEW: Two-Layer Scores */
  siteDiscoverabilityScore: number;
  siteDiscoverabilityBreakdown: SiteDiscoverabilityBreakdown;
  
  productExtractabilityScore: number;
  productExtractabilityBreakdown?: ProductExtractabilityBreakdown;
  
  /** NEW: URL type analysis */
  analyzedUrlType: UrlType;
  analyzedSingleProduct: boolean;
  showFullSiteOption: boolean;
  
  /** Legacy aggregate score (average of two scores) */
  aggregateScore: number;
  aggregateScoreBreakdown?: AggregateScoreBreakdown;
  
  /** Legacy factors (kept for compatibility) */
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
  
  /** Schema coverage */
  schemaCoverage: {
    productPages: number;
    organizationPages: number;
    faqPages: number;
    breadcrumbPages: number;
    reviewPages: number;
    aggregateRatingPages: number;
    offerPages: number;
    pagesWithSchema: number;
    pagesWithoutSchema: number;
    pagesWithGTIN: number;
    pagesWithMPN: number;
    pagesWithSKU: number;
  };
  
  /** Page type breakdown */
  pageTypeBreakdown: {
    product: number;
    collection: number;
    blog: number;
    homepage: number;
    other: number;
  };
  
  /** LLM discovery prompts */
  llmDiscoveryPrompts: {
    category: string;
    prompts: string[];
    likelihood: "high" | "medium" | "low";
  }[];
  
  /** Generated artifacts */
  generatedArtifacts?: GeneratedArtifacts;
  
  /** Visibility limitations */
  limitations: {
    trainingDataInclusion: boolean;
    domainAuthority: boolean;
    brandRecognition: boolean;
    citationDensity: boolean;
    userBehavior: boolean;
    externalMentions: boolean;
    thirdPartyReviews: boolean;
  };
  
  /** Comparison context */
  comparisonContext: {
    siteDiscoverability: {
      percentile: number;
      label: string;
    };
    productExtractability: {
      percentile: number;
      label: string;
    };
    comparedTo: string;
  };
  
  /** Redirect info */
  resolvedUrl?: {
    original: string;
    final: string;
    originalDomain: string;
    finalDomain: string;
    chain: string[];
  };
}

// ============================================
// GENERATED ARTIFACTS
// ============================================

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

// ============================================
// TWO-LAYER SCORING MODEL
// ============================================

export type UrlType = "domain" | "product" | "collection";

export interface UrlAnalysis {
  type: UrlType;
  domain: string;
  isProductPage: boolean;
  isHomepage: boolean;
  isCollection: boolean;
}

export interface SiteDiscoverabilityBreakdown {
  llmsTxt: {
    points: number;
    max: number;
    present: boolean;
    hasContent: boolean;
    hasCategories: boolean;
    hasProducts: boolean;
    quality: "complete" | "partial" | "missing";
  };
  aiCrawlerAccess: {
    points: number;
    max: number;
    allowsOAI: boolean;
    allowsGPTBot: boolean;
    allowsChatGPTUser: boolean;
    hasRobotsTxt: boolean;
    details: string;
  };
  sitemap: {
    points: number;
    max: number;
    present: boolean;
    productCount: number;
    urlCount: number;
  };
  organizationSchema: {
    points: number;
    max: number;
    present: boolean;
    hasName: boolean;
    hasLogo: boolean;
    hasSameAs: boolean;
    hasDescription: boolean;
  };
  categoryPresence: {
    points: number;
    max: number;
    categories: string[];
    count: number;
  };
  brandConsistency: {
    points: number;
    max: number;
    consistent: boolean;
    brandVariations: string[];
    dominantBrand: string | null;
  };
  technicalHealth: {
    points: number;
    max: number;
    https: boolean;
    accessible: boolean;
    noMajorErrors: boolean;
  };
  externalMentions: {
    measurable: false;
    importance: "high";
    weight: string;
    recommendation: string;
  };
  domainAuthority: {
    measurable: false;
    importance: "medium";
    weight: string;
    recommendation: string;
  };
}

export interface SiteDiscoverabilityScore {
  score: number;
  max: number;
  label: string;
  breakdown: SiteDiscoverabilityBreakdown;
}

export interface ProductExtractabilityBreakdown {
  productSchema: {
    points: number;
    max: number;
    present: boolean;
    hasName: boolean;
    hasDescription: boolean;
    hasImage: boolean;
    hasOffers: boolean;
    complete: boolean;
  };
  identifiers: {
    points: number;
    max: number;
    hasGTIN: boolean;
    hasMPN: boolean;
    hasSKU: boolean;
    values: {
      gtin: string | null;
      mpn: string | null;
      sku: string | null;
    };
    count: number;
  };
  pricing: {
    points: number;
    max: number;
    found: boolean;
    source: "schema" | "text" | null;
    value: number | null;
    currency: string | null;
    hasPriceRange: boolean;
  };
  availability: {
    points: number;
    max: number;
    found: boolean;
    status: "in_stock" | "out_of_stock" | "preorder" | "unknown";
    source: "schema" | "text" | null;
  };
  aggregateRating: {
    points: number;
    max: number;
    found: boolean;
    rating: number | null;
    maxRating: number;
    source: "schema" | "text" | null;
  };
  reviewCount: {
    points: number;
    max: number;
    found: boolean;
    count: number;
  };
  images: {
    points: number;
    max: number;
    count: number;
    withAlt: number;
    productImages: number;
  };
  specifications: {
    points: number;
    max: number;
    found: boolean;
    count: number;
    source: "table" | "list" | "schema" | null;
  };
  thirdPartyReviews: {
    measurable: false;
    importance: "high";
    weight: string;
    recommendation: string;
  };
}

export interface ProductExtractabilityScore {
  score: number;
  max: number;
  label: string;
  breakdown: ProductExtractabilityBreakdown;
}
