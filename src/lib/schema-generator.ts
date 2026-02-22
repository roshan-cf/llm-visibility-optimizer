import { 
  PageAnalysis, 
  SiteAnalysis, 
  GeneratedLlmsTxt, 
  GeneratedSchema,
  PageScoreBreakdown 
} from "./types";

export function calculatePageScore(
  page: PageAnalysis
): { score: number; breakdown: PageScoreBreakdown } {
  const breakdown: PageScoreBreakdown = {
    critical: {
      productSchema: { points: 0, max: 25, present: page.schemas.hasProductSchema },
      organizationSchema: { points: 0, max: 10, present: page.schemas.hasOrganizationSchema },
    },
    important: {
      reviews: { points: 0, max: 15, present: page.reviews.hasReviews || page.schemas.hasAggregateRating },
      faq: { points: 0, max: 5, present: page.schemas.hasFAQSchema },
      author: { points: 0, max: 5, present: page.author?.hasAuthor || false },
      freshness: { points: 0, max: 2, status: page.freshness?.status || "unknown" },
    },
    basic: {
      metaDescription: { points: 0, max: 10, length: page.metaDescription.length },
      h1Structure: { points: 0, max: 5, count: page.headings.h1 },
      imageAlt: { points: 0, max: 5, coverage: page.images.total > 0 ? Math.round((page.images.withAlt / page.images.total) * 100) : 100 },
    },
    enhancements: {
      anySchema: { points: 0, max: 5, present: page.jsonLdScripts.length > 0 },
      openGraph: { points: 0, max: 5, count: Object.keys(page.openGraph).length },
      wordCount: { points: 0, max: 5, count: page.wordCount },
    },
    penalties: {
      noSchema: { points: 0, reason: "" },
      shortMeta: { points: 0, reason: "" },
      missingH1: { points: 0, reason: "" },
      multipleH1: { points: 0, reason: "" },
    },
  };

  // CRITICAL (35 points max)
  if (page.schemas.hasProductSchema) {
    breakdown.critical.productSchema.points = 25;
  }
  if (page.schemas.hasOrganizationSchema) {
    breakdown.critical.organizationSchema.points = 10;
  }

  // IMPORTANT (30 points max)
  if (page.reviews.hasReviews || page.schemas.hasAggregateRating) {
    breakdown.important.reviews.points = 15;
  }
  if (page.schemas.hasFAQSchema) {
    breakdown.important.faq.points = 5;
  }
  if (page.author?.hasAuthor) {
    breakdown.important.author.points = 5;
  }
  // Freshness scoring (industry standard: don't penalize unknown dates for e-commerce)
  // 2 points = fresh (< 90 days), 1 point = unknown (neutral), 0 points = stale
  if (page.freshness?.status === "fresh") {
    breakdown.important.freshness.points = 2;
  } else if (page.freshness?.status === "unknown") {
    breakdown.important.freshness.points = 1; // Neutral score - don't penalize what we can't detect
  }

  // BASIC SEO (20 points max)
  if (page.metaDescription.length >= 120) {
    breakdown.basic.metaDescription.points = 10;
  } else if (page.metaDescription.length >= 80) {
    breakdown.basic.metaDescription.points = 5;
  }
  if (page.headings.h1 === 1) {
    breakdown.basic.h1Structure.points = 5;
  }
  if (page.images.total > 0 && page.images.withAlt === page.images.total) {
    breakdown.basic.imageAlt.points = 5;
  } else if (page.images.total > 0 && page.images.withAlt >= page.images.total * 0.8) {
    breakdown.basic.imageAlt.points = 2;
  }

  // ENHANCEMENTS (15 points max)
  if (page.jsonLdScripts.length > 0) {
    breakdown.enhancements.anySchema.points = 5;
  }
  if (Object.keys(page.openGraph).length >= 4) {
    breakdown.enhancements.openGraph.points = 5;
  } else if (Object.keys(page.openGraph).length >= 2) {
    breakdown.enhancements.openGraph.points = 2;
  }
  if (page.wordCount >= 300) {
    breakdown.enhancements.wordCount.points = 5;
  } else if (page.wordCount >= 150) {
    breakdown.enhancements.wordCount.points = 2;
  }

  // PENALTIES
  if (page.jsonLdScripts.length === 0) {
    breakdown.penalties.noSchema = { points: -5, reason: "No structured data found" };
  }
  if (page.metaDescription.length < 50) {
    breakdown.penalties.shortMeta = { points: -5, reason: "Very short meta description" };
  }
  if (page.headings.h1 === 0) {
    breakdown.penalties.missingH1 = { points: -5, reason: "Missing H1 tag" };
  } else if (page.headings.h1 > 1) {
    breakdown.penalties.multipleH1 = { points: -3, reason: "Multiple H1 tags" };
  }

  // Calculate total
  let score = 0;
  
  score += breakdown.critical.productSchema.points;
  score += breakdown.critical.organizationSchema.points;
  score += breakdown.important.reviews.points;
  score += breakdown.important.faq.points;
  score += breakdown.important.author.points;
  score += breakdown.important.freshness.points;
  score += breakdown.basic.metaDescription.points;
  score += breakdown.basic.h1Structure.points;
  score += breakdown.basic.imageAlt.points;
  score += breakdown.enhancements.anySchema.points;
  score += breakdown.enhancements.openGraph.points;
  score += breakdown.enhancements.wordCount.points;
  
  score += breakdown.penalties.noSchema.points;
  score += breakdown.penalties.shortMeta.points;
  score += breakdown.penalties.missingH1.points;
  score += breakdown.penalties.multipleH1.points;

  score = Math.max(0, Math.min(100, score));

  return { score, breakdown };
}

export function calculateAggregateScore(
  result: Pick<SiteAnalysis, "pages" | "hasRobotsTxt" | "hasSitemap" | "hasLlmsTxt" | "schemaCoverage" | "pagesAnalyzed">
): { score: number; breakdown: SiteAnalysis["aggregateScoreBreakdown"] } {
  const totalPages = result.pagesAnalyzed || 1;

  // Product Schema (20%)
  const productSchemaScore = result.schemaCoverage.productPages > 0 
    ? Math.min(100, (result.schemaCoverage.productPages / totalPages) * 150)
    : 0;

  // Organization Schema (10%)
  const orgSchemaScore = result.schemaCoverage.organizationPages > 0 ? 100 : 0;

  // Review Schema (15%)
  const reviewSchemaScore = result.schemaCoverage.reviewPages > 0
    ? Math.min(100, (result.schemaCoverage.reviewPages / totalPages) * 200)
    : 0;

  // llms.txt (10%)
  const llmsTxtScore = result.hasLlmsTxt ? 100 : 0;

  // Schema Coverage (10%)
  const schemaCoverageScore = (result.schemaCoverage.pagesWithSchema / totalPages) * 100;

  // Meta Descriptions (10%)
  const metaScore = result.pages.reduce((sum, p) => sum + (p.metaDescription.length >= 120 ? 1 : 0), 0);
  const metaScorePercent = (metaScore / totalPages) * 100;

  // Heading Structure (5%)
  const h1Score = result.pages.reduce((sum, p) => sum + (p.headings.h1 === 1 ? 1 : 0), 0);
  const h1ScorePercent = (h1Score / totalPages) * 100;

  // Image Alt (5%)
  const altScore = result.pages.reduce((sum, p) => 
    sum + (p.images.total === 0 || p.images.withoutAlt === 0 ? 1 : 0), 0
  );
  const altScorePercent = (altScore / totalPages) * 100;

  // robots.txt (5%)
  const robotsScore = result.hasRobotsTxt ? 100 : 0;

  // Sitemap (5%)
  const sitemapScore = result.hasSitemap ? 100 : 0;

  // OG Tags (5%)
  const ogScore = result.pages.reduce((sum, p) => sum + (Object.keys(p.openGraph).length >= 4 ? 1 : 0), 0);
  const ogScorePercent = (ogScore / totalPages) * 100;

  const breakdown: SiteAnalysis["aggregateScoreBreakdown"] = {
    productSchema: { score: productSchemaScore, weight: 0.20, pages: result.schemaCoverage.productPages },
    organizationSchema: { score: orgSchemaScore, weight: 0.10, present: result.schemaCoverage.organizationPages > 0 },
    reviewSchema: { score: reviewSchemaScore, weight: 0.15, pages: result.schemaCoverage.reviewPages },
    llmsTxt: { score: llmsTxtScore, weight: 0.10, present: result.hasLlmsTxt },
    schemaCoverage: { score: schemaCoverageScore, weight: 0.10, percentage: Math.round(schemaCoverageScore) },
    metaDescriptions: { score: metaScorePercent, weight: 0.10, percentage: Math.round(metaScorePercent) },
    headingStructure: { score: h1ScorePercent, weight: 0.05, percentage: Math.round(h1ScorePercent) },
    imageAlt: { score: altScorePercent, weight: 0.05, percentage: Math.round(altScorePercent) },
    robotsTxt: { score: robotsScore, weight: 0.05, present: result.hasRobotsTxt },
    sitemap: { score: sitemapScore, weight: 0.05, present: result.hasSitemap },
    ogTags: { score: ogScorePercent, weight: 0.05, percentage: Math.round(ogScorePercent) },
  };

  const score = Math.round(
    productSchemaScore * 0.20 +
    orgSchemaScore * 0.10 +
    reviewSchemaScore * 0.15 +
    llmsTxtScore * 0.10 +
    schemaCoverageScore * 0.10 +
    metaScorePercent * 0.10 +
    h1ScorePercent * 0.05 +
    altScorePercent * 0.05 +
    robotsScore * 0.05 +
    sitemapScore * 0.05 +
    ogScorePercent * 0.05
  );

  return { score: Math.max(0, Math.min(100, score)), breakdown };
}

export function generateLlmsTxt(result: SiteAnalysis): GeneratedLlmsTxt {
  const warnings: string[] = [];
  const mainPage = result.pages[0];

  // Extract tagline
  let tagline = mainPage?.metaDescription || "";
  if (!tagline && mainPage?.h1Texts.length > 0) {
    tagline = mainPage.h1Texts[0];
  }
  if (!tagline) {
    tagline = `${result.domain} - E-commerce Website`;
    warnings.push("Could not extract tagline from meta description or H1");
  }

  // Extract products from product pages or titles
  const products: string[] = [];
  const categories: Set<string> = new Set();

  result.pages.forEach(page => {
    if (page.schemas.hasProductSchema && page.title) {
      products.push(page.title);
    }
    
    // Extract categories from URL paths
    const urlPath = new URL(page.url).pathname;
    const segments = urlPath.split("/").filter(s => s.length > 0 && !s.match(/\.(html|php|asp)$/));
    segments.forEach(seg => {
      if (seg.length > 2 && seg.length < 30 && !seg.match(/^[0-9]+$/)) {
        categories.add(seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
      }
    });
  });

  if (products.length === 0) {
    warnings.push("No product schema found - product list may be incomplete");
  }

  // About section
  let about = "";
  if (mainPage?.schemas.hasOrganizationSchema && mainPage.metaDescription) {
    about = mainPage.metaDescription;
  } else if (mainPage?.metaDescription) {
    about = mainPage.metaDescription;
  } else {
    about = `${result.domain} is an e-commerce website.`;
    warnings.push("Limited organization information available");
  }

  // Key pages (prioritize pages with schema)
  const keyPages = result.pages
    .filter(p => p.jsonLdScripts.length > 0 || p.schemas.hasProductSchema)
    .slice(0, 10)
    .map(p => ({
      title: p.title || "Untitled",
      url: p.url
    }));

  if (keyPages.length < 5) {
    warnings.push("Few structured pages found - key pages list may be incomplete");
  }

  // Build content
  const sections = {
    tagline,
    products: products.slice(0, 20),
    categories: Array.from(categories).slice(0, 10),
    about,
    keyPages,
    sitemap: result.sitemapUrls[0] || `${result.mainUrl}/sitemap.xml`,
  };

  let content = `# ${result.domain}\n`;
  content += `> ${tagline}\n\n`;
  
  if (sections.categories.length > 0) {
    content += `## Categories\n`;
    sections.categories.forEach(cat => {
      content += `- ${cat}\n`;
    });
    content += `\n`;
  }

  if (sections.products.length > 0) {
    content += `## Products\n`;
    sections.products.slice(0, 15).forEach(prod => {
      content += `- ${prod}\n`;
    });
    content += `\n`;
  }

  content += `## About\n`;
  content += `${about}\n\n`;

  content += `## Key Pages\n`;
  keyPages.slice(0, 10).forEach(p => {
    content += `- [${p.title}](${p.url})\n`;
  });
  content += `\n`;

  content += `## Sitemap\n`;
  content += `- [Sitemap](${sections.sitemap})\n`;

  const confidence: "high" | "medium" | "low" = 
    warnings.length === 0 ? "high" : 
    warnings.length <= 2 ? "medium" : "low";

  return {
    content,
    sections,
    warnings,
    confidence,
  };
}

export function generateSchemaForPage(page: PageAnalysis): GeneratedSchema[] {
  const schemas: GeneratedSchema[] = [];

  // Product Schema
  if (page.schemas.hasProductSchema || page.title?.toLowerCase().includes("product") || page.url.includes("/product")) {
    const productSchema = generateProductSchemaFromPage(page);
    if (productSchema) schemas.push(productSchema);
  }

  // Breadcrumb Schema (always applicable)
  const breadcrumbSchema = generateBreadcrumbSchemaFromPage(page);
  if (breadcrumbSchema) schemas.push(breadcrumbSchema);

  // FAQ Schema (if we detected question patterns)
  if (page.schemas.hasFAQSchema || page.quoteReadySnippets.length >= 3) {
    const faqSchema = generateFAQSchemaFromPage(page);
    if (faqSchema) schemas.push(faqSchema);
  }

  return schemas;
}

function generateProductSchemaFromPage(page: PageAnalysis): GeneratedSchema | null {
  const fieldsExtracted: string[] = [];
  const fieldsMissing: string[] = [];
  const suggestions: string[] = [];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
  };

  // Name
  if (page.title) {
    schema.name = page.title;
    fieldsExtracted.push("name");
  } else {
    fieldsMissing.push("name");
    suggestions.push("Add a descriptive product title");
  }

  // Description
  if (page.metaDescription) {
    schema.description = page.metaDescription;
    fieldsExtracted.push("description");
  } else {
    fieldsMissing.push("description");
    suggestions.push("Add a product description");
  }

  // URL
  schema.url = page.url;
  fieldsExtracted.push("url");

  // Image (check OG image)
  if (page.openGraph.image) {
    schema.image = page.openGraph.image;
    fieldsExtracted.push("image");
  } else {
    fieldsMissing.push("image");
    suggestions.push("Add product images");
  }

  // Price (try to extract from content)
  const priceMatch = page.title?.match(/\$[\d,.]+|\d+(?:\.\d{2})?\s*(?:USD|dollars?)/i);
  if (priceMatch) {
    const priceValue = priceMatch[0].replace(/[^0-9.]/g, "");
    schema.offers = {
      "@type": "Offer",
      price: priceValue,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };
    fieldsExtracted.push("price");
  } else {
    fieldsMissing.push("price");
    suggestions.push("Add product pricing information");
  }

  // Reviews
  if (page.reviews.hasReviews && page.reviews.averageRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: page.reviews.averageRating,
      reviewCount: page.reviews.ratingCount || page.reviews.reviewCount,
    };
    fieldsExtracted.push("aggregateRating");
  }

  const confidence: "high" | "medium" | "low" = 
    fieldsMissing.length === 0 ? "high" : 
    fieldsMissing.length <= 2 ? "medium" : "low";

  return {
    type: "Product",
    jsonLd: schema,
    jsonString: JSON.stringify(schema, null, 2),
    confidence,
    fieldsExtracted,
    fieldsMissing,
    suggestions,
    sourceUrl: page.url,
  };
}

function generateBreadcrumbSchemaFromPage(page: PageAnalysis): GeneratedSchema | null {
  const fieldsExtracted: string[] = [];
  const fieldsMissing: string[] = [];

  const url = new URL(page.url);
  const pathSegments = url.pathname.split("/").filter(s => s.length > 0);

  if (pathSegments.length === 0) return null;

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: url.origin,
    },
  ];

  pathSegments.forEach((segment, index) => {
    const name = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name,
      item: `${url.origin}/${pathSegments.slice(0, index + 1).join("/")}`,
    });
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };

  fieldsExtracted.push("breadcrumb items");

  return {
    type: "BreadcrumbList",
    jsonLd: schema,
    jsonString: JSON.stringify(schema, null, 2),
    confidence: "high",
    fieldsExtracted,
    fieldsMissing,
    suggestions: [],
    sourceUrl: page.url,
  };
}

function generateFAQSchemaFromPage(page: PageAnalysis): GeneratedSchema | null {
  const fieldsExtracted: string[] = [];
  const fieldsMissing: string[] = [];
  const suggestions: string[] = [];

  // Use quote-ready snippets as potential Q&A
  const items = page.quoteReadySnippets.slice(0, 5).map((snippet, index) => ({
    "@type": "Question",
    name: snippet.length > 60 ? snippet.substring(0, 57) + "..." : snippet,
    acceptedAnswer: {
      "@type": "Answer",
      text: snippet,
    },
  }));

  if (items.length === 0) {
    suggestions.push("Add FAQ sections with clear questions and answers");
    return null;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items,
  };

  fieldsExtracted.push("FAQ items from content");

  return {
    type: "FAQPage",
    jsonLd: schema,
    jsonString: JSON.stringify(schema, null, 2),
    confidence: "low",
    fieldsExtracted,
    fieldsMissing,
    suggestions: ["Review auto-generated FAQ items for accuracy", "Add more specific questions"],
    sourceUrl: page.url,
  };
}

export function generateOrganizationSchema(result: SiteAnalysis): GeneratedSchema | null {
  const mainPage = result.pages[0];
  const fieldsExtracted: string[] = [];
  const fieldsMissing: string[] = [];
  const suggestions: string[] = [];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    url: result.mainUrl,
  };
  fieldsExtracted.push("url");

  // Name
  if (mainPage?.title) {
    const name = mainPage.title.split("|")[0].split("-")[0].trim();
    schema.name = name || result.domain;
    fieldsExtracted.push("name");
  } else {
    schema.name = result.domain;
    fieldsMissing.push("name");
    suggestions.push("Add organization name");
  }

  // Description
  if (mainPage?.metaDescription) {
    schema.description = mainPage.metaDescription;
    fieldsExtracted.push("description");
  } else {
    fieldsMissing.push("description");
    suggestions.push("Add organization description");
  }

  // Logo
  if (mainPage?.openGraph.image) {
    schema.logo = mainPage.openGraph.image;
    fieldsExtracted.push("logo");
  } else {
    fieldsMissing.push("logo");
    suggestions.push("Add organization logo URL");
  }

  // SameAs (social links - would need to extract from page)
  fieldsMissing.push("sameAs (social profiles)");
  suggestions.push("Add social media profile URLs");

  const confidence: "high" | "medium" | "low" = 
    fieldsMissing.length <= 1 ? "high" : 
    fieldsMissing.length <= 3 ? "medium" : "low";

  return {
    type: "Organization",
    jsonLd: schema,
    jsonString: JSON.stringify(schema, null, 2),
    confidence,
    fieldsExtracted,
    fieldsMissing,
    suggestions,
    sourceUrl: result.mainUrl,
  };
}
