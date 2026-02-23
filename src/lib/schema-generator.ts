/**
 * LLM Visibility Optimizer - Scoring Engine
 * 
 * SCORING PHILOSOPHY:
 * We measure "content extractability" - can an LLM understand your product information?
 * 
 * KEY INSIGHT:
 * LLMs extract info from schema.org AND from visible content (text, patterns, HTML structure).
 * Sites like Amazon have minimal schema but excellent content extractability.
 * We score based on information presence, not just schema presence.
 * 
 * SCORING MODEL:
 * - Product pages: Scored on extractability (identity, pricing, availability, reviews, specs, trust)
 * - Collection pages: Scored on navigation/structure
 * - Blog pages: Scored on content quality
 * - Homepage: Scored on brand presence
 */

import { 
  PageAnalysis, 
  SiteAnalysis, 
  GeneratedLlmsTxt, 
  GeneratedSchema,
  PageScoreBreakdown,
  PageType,
  ContentExtraction
} from "./types";

// ============================================
// PAGE TYPE DETECTION
// ============================================

/**
 * Detects the type of page based on URL patterns and content
 */
export function detectPageType(url: string, page: Partial<PageAnalysis>): PageType {
  const urlPath = new URL(url).pathname.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // Homepage
  if (urlPath === "/" || urlPath === "") {
    return "homepage";
  }
  
  // Cart
  if (urlPath.includes("/cart") || urlPath.includes("/basket") || urlPath.includes("/checkout")) {
    return "cart";
  }
  
  // Search
  if (urlPath.includes("/search") || urlPath.includes("/search-results")) {
    return "search";
  }
  
  // Blog/Article
  if (
    urlPath.includes("/blog/") || 
    urlPath.includes("/news/") || 
    urlPath.includes("/article/") ||
    urlPath.includes("/post/") ||
    (page.schemas?.hasArticleSchema ?? false)
  ) {
    return "blog";
  }
  
  // Product page detection
  const productPatterns = [
    /\/products?\//i,
    /\/p\//i,
    /\/dp\//i,           // Amazon pattern
    /\/item\//i,
    /\/product-/i,
    /\?product=/i,
    /\/[a-z0-9-]+\/p-[a-z0-9]+/i, // Myntra-style
  ];
  
  // Check URL patterns
  if (productPatterns.some(p => p.test(urlPath))) {
    return "product";
  }
  
  // Check for product schema
  if (page.schemas?.hasProductSchema) {
    return "product";
  }
  
  // Collection/Category page
  const collectionPatterns = [
    /\/collections?\//i,
    /\/categories?\//i,
    /\/category\//i,
    /\/c\//i,
    /\/shop\//i,
    /\/catalog\//i,
    /\/department\//i,
  ];
  
  if (collectionPatterns.some(p => p.test(urlPath))) {
    return "collection";
  }
  
  return "other";
}

// ============================================
// CONTENT EXTRACTION - PRICE DETECTION
// ============================================

/**
 * Extracts price information from text content
 * Supports multiple currencies and formats
 */
export function extractPriceFromText(text: string): { value: number; currency: string; rawText: string } | null {
  if (!text) return null;
  
  // Currency symbol mappings
  const currencySymbols: Record<string, string> = {
    "$": "USD",
    "₹": "INR",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
    "₽": "RUB",
    "₩": "KRW",
    "A$": "AUD",
    "C$": "CAD",
    "HK$": "HKD",
  };
  
  // Price patterns ordered by specificity
  const pricePatterns = [
    // Symbol before number: $1,299 or ₹999
    /([$₹€£¥₽₩]|A\$|C\$|HK\$)\s*([\d,]+(?:\.\d{2})?)/g,
    // Number with currency code: 1299 USD or 999 INR
    /([\d,]+(?:\.\d{2})?)\s*(USD|INR|EUR|GBP|JPY|AUD|CAD|HKD)/gi,
    // Text patterns: "Price: $1,299" or "Rs. 999"
    /(?:Price|MRP|Cost|Sale|Our Price)[:\s]*([$₹€£¥]|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/gi,
    // Indian format: ₹ 1,299 or Rs. 1,299
    /(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/g,
  ];
  
  for (const pattern of pricePatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      const rawText = match[0];
      
      // Extract currency
      let currency = "USD";
      for (const [symbol, code] of Object.entries(currencySymbols)) {
        if (rawText.includes(symbol)) {
          currency = code;
          break;
        }
      }
      // Check for currency code in match
      if (match[2] && match[2].match(/^[A-Z]{3}$/)) {
        currency = match[2].toUpperCase();
      }
      
      // Extract numeric value
      const numStr = rawText.replace(/[^0-9.]/g, "");
      const value = parseFloat(numStr);
      
      if (value > 0) {
        return { value, currency, rawText };
      }
    }
  }
  
  return null;
}

// ============================================
// CONTENT EXTRACTION - RATING DETECTION
// ============================================

/**
 * Extracts rating information from text content
 * Supports star patterns, numeric ratings, and review counts
 */
export function extractRatingFromText(text: string): { value: number; maxRating: number; count: number; rawText: string } | null {
  if (!text) return null;
  
  // Star pattern: ★★★★☆ or ★★★★★
  const starPatterns = [
    /(★+)(☆*)/g,
    /(\d)\s*(?:out of|\/)\s*(\d)/gi,
    /(\d(?:\.\d)?)\s*(?:stars?|★)/gi,
    /(?:rated?|rating)[:\s]*(\d(?:\.\d)?)/gi,
  ];
  
  // Try star symbols first
  const starMatch = text.match(/★/g);
  if (starMatch) {
    const fullStars = (text.match(/★/g) || []).length;
    const emptyStars = (text.match(/☆/g) || []).length;
    const total = fullStars + emptyStars;
    
    if (total > 0 && total <= 5) {
      // Look for review count
      const countMatch = text.match(/(\d[\d,]*)\s*(?:reviews?|ratings?)/i);
      const count = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;
      
      return { 
        value: fullStars, 
        maxRating: total, 
        count,
        rawText: text.substring(0, 100)
      };
    }
  }
  
  // Try numeric patterns: "4.5 out of 5" or "4.5 stars"
  for (const pattern of starPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      let value = 0;
      let maxRating = 5;
      
      if (match[1] && match[2]) {
        // "4.5 out of 5" format
        value = parseFloat(match[1]) || 0;
        maxRating = parseInt(match[2]) || 5;
      } else if (match[1]) {
        value = parseFloat(match[1]) || 0;
      }
      
      if (value > 0) {
        // Look for review count
        const countMatch = text.match(/(\d[\d,]*)\s*(?:reviews?|ratings?)/i);
        const count = countMatch ? parseInt(countMatch[1].replace(/,/g, "")) : 0;
        
        return { value, maxRating, count, rawText: match[0] };
      }
    }
  }
  
  return null;
}

// ============================================
// CONTENT EXTRACTION - AVAILABILITY DETECTION
// ============================================

/**
 * Extracts availability/stock status from text
 */
export function extractAvailabilityFromText(text: string): { status: "in_stock" | "out_of_stock" | "preorder" | "unknown"; rawText: string } {
  if (!text) return { status: "unknown", rawText: "" };
  
  const inStockPatterns = [
    /\bin\s*stock\b/i,
    /\bavailable\b/i,
    /\badd\s*to\s*cart\b/i,
    /\bbuy\s*now\b/i,
    /\badd\s*to\s*bag\b/i,
    /\bin\s*store\b/i,
    /\bready\s*to\s*ship\b/i,
  ];
  
  const outOfStockPatterns = [
    /\bout\s*of\s*stock\b/i,
    /\bsold\s*out\b/i,
    /\bunavailable\b/i,
    /\bcurrently\s*unavailable\b/i,
    /\bnotify\s*me\b/i,
    /\bwaitlist\b/i,
  ];
  
  const preorderPatterns = [
    /\bpre[-\s]*order\b/i,
    /\bcoming\s*soon\b/i,
    /\bavailable\s*on\b.*\d/i,
  ];
  
  // Check out of stock first (more specific)
  for (const pattern of outOfStockPatterns) {
    const match = text.match(pattern);
    if (match) {
      return { status: "out_of_stock", rawText: match[0] };
    }
  }
  
  // Check preorder
  for (const pattern of preorderPatterns) {
    const match = text.match(pattern);
    if (match) {
      return { status: "preorder", rawText: match[0] };
    }
  }
  
  // Check in stock
  for (const pattern of inStockPatterns) {
    const match = text.match(pattern);
    if (match) {
      return { status: "in_stock", rawText: match[0] };
    }
  }
  
  return { status: "unknown", rawText: "" };
}

// ============================================
// CONTENT EXTRACTION - BRAND DETECTION
// ============================================

/**
 * Extracts brand information from content
 */
export function extractBrandFromText(text: string, page: Partial<PageAnalysis>): { value: string } | null {
  // Check schema first
  if (page.schemas?.hasProductSchema) {
    // Brand would be in JSON-LD - handled elsewhere
  }
  
  // Text patterns
  const brandPatterns = [
    /(?:brand|by|manufacturer)[:\s]*([A-Z][A-Za-z0-9\s]{2,30})/i,
    /sold\s*by[:\s]*([A-Z][A-Za-z0-9\s]{2,30})/i,
  ];
  
  for (const pattern of brandPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return { value: match[1].trim() };
    }
  }
  
  return null;
}

// ============================================
// CONTENT EXTRACTION - SPECS DETECTION
// ============================================

/**
 * Detects product specifications in content
 */
export function detectSpecifications(page: Partial<PageAnalysis>): { detected: boolean; count: number; source: "table" | "list" | "schema" | null } {
  let count = 0;
  let source: "table" | "list" | "schema" | null = null;
  
  // Check semantic elements for tables/lists
  if (page.semanticElements) {
    // Specification tables usually have class/id containing "spec", "detail", "feature"
    // We count tables and definition lists as potential spec containers
    const tables = page.semanticElements["table"] || 0;
    const lists = (page.semanticElements["ul"] || 0) + (page.semanticElements["ol"] || 0);
    
    if (tables > 0) {
      count = tables;
      source = "table";
    } else if (lists > 0) {
      count = lists;
      source = "list";
    }
  }
  
  // Check for product schema which may have additionalProperty
  if (page.schemas?.hasProductSchema) {
    source = "schema";
    count = Math.max(count, 1);
  }
  
  return {
    detected: count > 0,
    count,
    source
  };
}

// ============================================
// CONTENT EXTRACTION - CTA DETECTION
// ============================================

/**
 * Detects purchase call-to-action buttons/links
 */
export function detectPurchaseCTA(text: string): { detected: boolean; buttons: string[] } {
  const ctaPatterns = [
    "add to cart",
    "add to bag",
    "buy now",
    "shop now",
    "order now",
    "purchase",
    "checkout",
    "add to basket",
  ];
  
  const found: string[] = [];
  const textLower = text.toLowerCase();
  
  for (const pattern of ctaPatterns) {
    if (textLower.includes(pattern)) {
      found.push(pattern);
    }
  }
  
  return {
    detected: found.length > 0,
    buttons: [...new Set(found)]
  };
}

// ============================================
// FULL CONTENT EXTRACTION
// ============================================

/**
 * Performs complete content extraction analysis for a page
 */
export function extractAllContent(page: Partial<PageAnalysis>): ContentExtraction {
  // Combine all text sources for pattern matching
  const allText = [
    page.title || "",
    page.metaDescription || "",
    page.h1Texts?.join(" ") || "",
  ].join(" ");
  
  // Extract price
  const priceResult = extractPriceFromText(allText);
  
  // Extract rating
  const ratingResult = extractRatingFromText(allText);
  
  // Extract availability
  const availabilityResult = extractAvailabilityFromText(allText);
  
  // Extract brand
  const brandResult = extractBrandFromText(allText, page);
  
  // Detect specs
  const specsResult = detectSpecifications(page);
  
  // Detect CTA
  const ctaResult = detectPurchaseCTA(allText);
  
  // Get category from URL or breadcrumbs
  let categoryValue: string | null = null;
  let categorySource: "schema" | "breadcrumb" | "url" | null = null;
  
  if (page.breadcrumbs && page.breadcrumbs.length > 0) {
    categoryValue = page.breadcrumbs[page.breadcrumbs.length - 1];
    categorySource = "breadcrumb";
  } else if (page.url) {
    const urlPath = new URL(page.url).pathname;
    const segments = urlPath.split("/").filter(s => s.length > 0);
    if (segments.length > 0) {
      categoryValue = segments[segments.length > 1 ? segments.length - 2 : 0].replace(/-/g, " ");
      categorySource = "url";
    }
  }
  
  // Determine product name source
  let productNameSource: "schema" | "h1" | "title" | "og" | null = null;
  let productNameValue: string | null = null;
  
  if (page.schemas?.hasProductSchema) {
    productNameSource = "schema";
    productNameValue = page.title || null;
  } else if (page.h1Texts && page.h1Texts.length > 0) {
    productNameSource = "h1";
    productNameValue = page.h1Texts[0];
  } else if (page.openGraph?.title) {
    productNameSource = "og";
    productNameValue = page.openGraph.title;
  } else if (page.title) {
    productNameSource = "title";
    productNameValue = page.title;
  }
  
  return {
    productName: {
      value: productNameValue,
      source: productNameSource
    },
    price: priceResult ? {
      value: priceResult.value,
      currency: priceResult.currency,
      source: "text",
      rawText: priceResult.rawText
    } : {
      value: null,
      currency: null,
      source: null,
      rawText: null
    },
    availability: {
      status: availabilityResult.status,
      source: availabilityResult.rawText ? "text" : null,
      rawText: availabilityResult.rawText || null
    },
    rating: ratingResult ? {
      value: ratingResult.value,
      maxRating: ratingResult.maxRating,
      count: ratingResult.count,
      source: "text",
      rawText: ratingResult.rawText
    } : {
      value: null,
      maxRating: 5,
      count: 0,
      source: null,
      rawText: null
    },
    brand: brandResult ? {
      value: brandResult.value,
      source: "text"
    } : {
      value: null,
      source: null
    },
    category: {
      value: categoryValue,
      source: categorySource
    },
    specifications: specsResult,
    images: {
      count: page.images?.total || 0,
      hasAlt: page.images?.withAlt || 0,
      productImages: page.images?.total || 0
    },
    purchaseCTA: ctaResult
  };
}

// ============================================
// PAGE SCORING - NEW MODEL
// ============================================

/**
 * Calculates extractability score for a page
 * 
 * SCORING PHILOSOPHY:
 * We use OR logic throughout - schema OR content extraction.
 * Schema is preferred but content extraction works too.
 * 
 * SCORING BREAKDOWN:
 * - Identity (25): Can LLM identify WHAT this is?
 * - Pricing (20): Can LLM find price info?
 * - Availability (10): Can LLM know if in stock?
 * - Reviews (20): Can LLM find ratings/reviews?
 * - Specifications (15): Product details available?
 * - Trust (10): Brand and purchase path?
 * - Schema Bonus (+15): Extra for structured data
 */
export function calculatePageScore(
  page: PageAnalysis
): { score: number; breakdown: PageScoreBreakdown } {
  
  // Detect page type
  const pageType = page.pageType || detectPageType(page.url, page);
  
  // Extract content patterns
  const extraction = page.contentExtraction || extractAllContent(page);
  
  // Initialize breakdown
  const breakdown: PageScoreBreakdown = {
    extractability: {
      score: 0,
      max: 100,
      label: "Poor"
    },
    identity: {
      productName: { points: 0, max: 10, found: false, source: null },
      description: { points: 0, max: 10, found: false, length: 0 },
      category: { points: 0, max: 5, found: false, value: null }
    },
    pricing: {
      price: { points: 0, max: 15, found: false, value: null, currency: null },
      currency: { points: 0, max: 5, found: false, symbol: null }
    },
    availability: {
      status: { points: 0, max: 10, found: false, value: null }
    },
    reviews: {
      hasReviews: { points: 0, max: 8, found: false },
      ratingValue: { points: 0, max: 6, found: false, value: null },
      reviewCount: { points: 0, max: 6, found: false, count: 0 }
    },
    specifications: {
      specsPresent: { points: 0, max: 10, found: false, count: 0 },
      images: { points: 0, max: 5, count: 0 }
    },
    trust: {
      brand: { points: 0, max: 5, found: false, value: null },
      purchasePath: { points: 0, max: 5, found: false, buttons: [] }
    },
    schemaBonus: {
      productSchema: { points: 0, max: 5, present: false },
      aggregateRatingSchema: { points: 0, max: 5, present: false },
      offerSchema: { points: 0, max: 5, present: false }
    },
    pageContext: {
      detectedType: pageType,
      isApplicable: pageType === "product" || pageType === "collection",
      reason: null
    }
  };
  
  // Skip scoring for non-product pages
  if (pageType !== "product" && pageType !== "collection") {
    breakdown.pageContext.reason = `Scoring only applies to product/collection pages. This is a ${pageType} page.`;
    return { score: 0, breakdown };
  }
  
  // ============================================
  // IDENTITY SCORING (25 points)
  // ============================================
  
  // Product Name (10 points) - Schema OR H1 OR Title
  if (page.schemas.hasProductSchema && page.title) {
    breakdown.identity.productName.points = 10;
    breakdown.identity.productName.found = true;
    breakdown.identity.productName.source = "schema";
  } else if (extraction.productName.value) {
    breakdown.identity.productName.points = 10;
    breakdown.identity.productName.found = true;
    breakdown.identity.productName.source = extraction.productName.source || "content";
  }
  
  // Description (10 points) - Schema OR Meta Description
  const descLength = page.metaDescription?.length || 0;
  if (page.schemas.hasProductSchema && descLength >= 50) {
    breakdown.identity.description.points = 10;
    breakdown.identity.description.found = true;
  } else if (descLength >= 120) {
    breakdown.identity.description.points = 10;
    breakdown.identity.description.found = true;
  } else if (descLength >= 50) {
    breakdown.identity.description.points = 5;
    breakdown.identity.description.found = true;
  }
  breakdown.identity.description.length = descLength;
  
  // Category (5 points) - Schema OR Breadcrumb OR URL
  if (page.schemas.hasBreadcrumbSchema) {
    breakdown.identity.category.points = 5;
    breakdown.identity.category.found = true;
    breakdown.identity.category.value = extraction.category?.value || null;
  } else if (extraction.category?.value) {
    breakdown.identity.category.points = 5;
    breakdown.identity.category.found = true;
    breakdown.identity.category.value = extraction.category.value;
  }
  
  // ============================================
  // PRICING SCORING (20 points)
  // ============================================
  
  // Price (15 points) - Schema OR Text Pattern
  if (page.schemas.hasOfferSchema) {
    breakdown.pricing.price.points = 15;
    breakdown.pricing.price.found = true;
    breakdown.pricing.price.value = extraction.price?.value || null;
    breakdown.pricing.price.currency = extraction.price?.currency || null;
  } else if (extraction.price?.value) {
    breakdown.pricing.price.points = 15;
    breakdown.pricing.price.found = true;
    breakdown.pricing.price.value = extraction.price.value;
    breakdown.pricing.price.currency = extraction.price.currency;
  }
  
  // Currency (5 points) - Schema OR Symbol Detection
  if (extraction.price?.currency) {
    breakdown.pricing.currency.points = 5;
    breakdown.pricing.currency.found = true;
    breakdown.pricing.currency.symbol = extraction.price.currency;
  }
  
  // ============================================
  // AVAILABILITY SCORING (10 points)
  // ============================================
  
  // Stock Status (10 points) - Schema OR Text Pattern
  if (page.schemas.hasOfferSchema || extraction.availability?.status !== "unknown") {
    breakdown.availability.status.points = 10;
    breakdown.availability.status.found = true;
    breakdown.availability.status.value = extraction.availability?.status || "in_stock";
  }
  
  // ============================================
  // REVIEWS SCORING (20 points)
  // ============================================
  
  // Has Reviews (8 points) - Schema OR Review Section
  if (page.schemas.hasAggregateRating || page.reviews?.hasReviews) {
    breakdown.reviews.hasReviews.points = 8;
    breakdown.reviews.hasReviews.found = true;
  } else if (extraction.rating?.value && extraction.rating.value > 0) {
    breakdown.reviews.hasReviews.points = 8;
    breakdown.reviews.hasReviews.found = true;
  }
  
  // Rating Value (6 points) - Schema OR Text Pattern
  const ratingValue = page.reviews?.averageRating || extraction.rating?.value || null;
  if (ratingValue !== null) {
    breakdown.reviews.ratingValue.points = 6;
    breakdown.reviews.ratingValue.found = true;
    breakdown.reviews.ratingValue.value = ratingValue;
  }
  
  // Review Count (6 points) - Schema OR Text Pattern
  const reviewCount = page.reviews?.reviewCount || extraction.rating?.count || 0;
  if (reviewCount > 0) {
    breakdown.reviews.reviewCount.points = reviewCount >= 10 ? 6 : (reviewCount >= 5 ? 4 : 2);
    breakdown.reviews.reviewCount.found = true;
    breakdown.reviews.reviewCount.count = reviewCount;
  }
  
  // ============================================
  // SPECIFICATIONS SCORING (15 points)
  // ============================================
  
  // Specs/Features (10 points) - Table/List Detection
  if (extraction.specifications?.detected) {
    breakdown.specifications.specsPresent.points = extraction.specifications.count >= 3 ? 10 : 5;
    breakdown.specifications.specsPresent.found = true;
    breakdown.specifications.specsPresent.count = extraction.specifications.count;
  }
  
  // Images (5 points) - 2+ images = full, 1 = partial
  const imageCount = extraction.images?.count || 0;
  if (imageCount >= 2) {
    breakdown.specifications.images.points = 5;
  } else if (imageCount === 1) {
    breakdown.specifications.images.points = 3;
  }
  breakdown.specifications.images.count = imageCount;
  
  // ============================================
  // TRUST SCORING (10 points)
  // ============================================
  
  // Brand (5 points) - Schema OR Text
  if (page.schemas.hasProductSchema || extraction.brand?.value) {
    breakdown.trust.brand.points = 5;
    breakdown.trust.brand.found = true;
    breakdown.trust.brand.value = extraction.brand?.value || null;
  }
  
  // Purchase Path (5 points) - CTA Buttons Detected
  if (extraction.purchaseCTA?.detected) {
    breakdown.trust.purchasePath.points = 5;
    breakdown.trust.purchasePath.found = true;
    breakdown.trust.purchasePath.buttons = extraction.purchaseCTA.buttons;
  }
  
  // ============================================
  // SCHEMA BONUS (+15 points)
  // ============================================
  
  // Product Schema Bonus
  if (page.schemas.hasProductSchema) {
    breakdown.schemaBonus.productSchema.points = 5;
    breakdown.schemaBonus.productSchema.present = true;
  }
  
  // AggregateRating Schema Bonus
  if (page.schemas.hasAggregateRating) {
    breakdown.schemaBonus.aggregateRatingSchema.points = 5;
    breakdown.schemaBonus.aggregateRatingSchema.present = true;
  }
  
  // Offer Schema Bonus
  if (page.schemas.hasOfferSchema) {
    breakdown.schemaBonus.offerSchema.points = 5;
    breakdown.schemaBonus.offerSchema.present = true;
  }
  
  // ============================================
  // CALCULATE TOTAL
  // ============================================
  
  let totalScore = 0;
  
  // Identity
  totalScore += breakdown.identity.productName.points;
  totalScore += breakdown.identity.description.points;
  totalScore += breakdown.identity.category.points;
  
  // Pricing
  totalScore += breakdown.pricing.price.points;
  totalScore += breakdown.pricing.currency.points;
  
  // Availability
  totalScore += breakdown.availability.status.points;
  
  // Reviews
  totalScore += breakdown.reviews.hasReviews.points;
  totalScore += breakdown.reviews.ratingValue.points;
  totalScore += breakdown.reviews.reviewCount.points;
  
  // Specifications
  totalScore += breakdown.specifications.specsPresent.points;
  totalScore += breakdown.specifications.images.points;
  
  // Trust
  totalScore += breakdown.trust.brand.points;
  totalScore += breakdown.trust.purchasePath.points;
  
  // Schema Bonus (can exceed 100, but capped)
  totalScore += breakdown.schemaBonus.productSchema.points;
  totalScore += breakdown.schemaBonus.aggregateRatingSchema.points;
  totalScore += breakdown.schemaBonus.offerSchema.points;
  
  // Cap at 100
  totalScore = Math.min(100, Math.max(0, totalScore));
  
  // Set label
  if (totalScore >= 80) {
    breakdown.extractability.label = "Excellent";
  } else if (totalScore >= 60) {
    breakdown.extractability.label = "Good";
  } else if (totalScore >= 40) {
    breakdown.extractability.label = "Fair";
  } else if (totalScore >= 20) {
    breakdown.extractability.label = "Poor";
  } else {
    breakdown.extractability.label = "Very Poor";
  }
  
  breakdown.extractability.score = totalScore;
  
  return { score: totalScore, breakdown };
}

// ============================================
// AGGREGATE SCORING - NEW MODEL
// ============================================

/**
 * Calculates site-level aggregate score
 * 
 * WEIGHTS:
 * - Product Extractability: 35% (avg of product page scores)
 * - Schema Bonus: 15% (% pages with schema)
 * - llms.txt: 10%
 * - Internal Linking: 10%
 * - Page Type Coverage: 10%
 * - robots.txt: 5%
 * - Sitemap: 5%
 * - Content Freshness: 5%
 * - Brand Consistency: 5%
 */
export function calculateAggregateScore(
  result: Pick<SiteAnalysis, "pages" | "hasRobotsTxt" | "hasSitemap" | "hasLlmsTxt" | "schemaCoverage" | "pagesAnalyzed" | "pageTypeBreakdown">
): { score: number; breakdown: SiteAnalysis["aggregateScoreBreakdown"] } {
  
  const totalPages = result.pagesAnalyzed || 1;
  const pages = result.pages || [];
  
  // Filter to only product pages for extractability score
  const productPages = pages.filter(p => 
    p.pageType === "product" || 
    p.schemas?.hasProductSchema ||
    p.url.includes("/product") ||
    p.url.includes("/products/")
  );
  const productPageCount = Math.max(productPages.length, 1);
  
  // 1. Product Extractability (35%)
  const avgExtractability = productPages.length > 0
    ? productPages.reduce((sum, p) => sum + (p.score || 0), 0) / productPageCount
    : 0;
  const productExtractabilityScore = avgExtractability;
  
  // 2. Schema Bonus (15%)
  const pagesWithSchema = result.schemaCoverage?.pagesWithSchema || pages.filter(p => p.jsonLdScripts?.length > 0).length;
  const schemaBonusScore = (pagesWithSchema / totalPages) * 100;
  
  // 3. llms.txt (10%)
  const llmsTxtScore = result.hasLlmsTxt ? 100 : 0;
  
  // 4. Internal Linking (10%)
  const avgLinksPerPage = pages.reduce((sum, p) => sum + (p.internalLinks || p.links?.length || 0), 0) / totalPages;
  const internalLinkingScore = Math.min(100, (avgLinksPerPage / 20) * 100); // 20+ links = 100%
  
  // 5. Page Type Coverage (10%)
  const productCount = result.pageTypeBreakdown?.product || pages.filter(p => p.pageType === "product").length;
  const collectionCount = result.pageTypeBreakdown?.collection || pages.filter(p => p.pageType === "collection").length;
  const blogCount = result.pageTypeBreakdown?.blog || pages.filter(p => p.pageType === "blog").length;
  
  // Good coverage: has products + collections + maybe blog
  let pageTypeCoverageScore = 0;
  if (productCount > 0) pageTypeCoverageScore += 50;
  if (collectionCount > 0) pageTypeCoverageScore += 30;
  if (blogCount > 0) pageTypeCoverageScore += 20;
  
  // 6. robots.txt (5%)
  const robotsScore = result.hasRobotsTxt ? 100 : 0;
  
  // 7. Sitemap (5%)
  const sitemapScore = result.hasSitemap ? 100 : 0;
  
  // 8. Content Freshness (5%)
  const freshPages = pages.filter(p => p.freshness?.status === "fresh").length;
  const contentFreshnessScore = (freshPages / totalPages) * 100;
  
  // 9. Brand Consistency (5%)
  // Check if brand name is consistent across pages
  const brandNames = new Set<string>();
  pages.forEach(p => {
    if (p.contentExtraction?.brand?.value) {
      brandNames.add(p.contentExtraction.brand.value.toLowerCase());
    }
  });
  const brandConsistencyScore = brandNames.size <= 1 ? 100 : (brandNames.size <= 3 ? 70 : 40);
  
  // Build breakdown
  const breakdown: SiteAnalysis["aggregateScoreBreakdown"] = {
    productExtractability: {
      score: Math.round(productExtractabilityScore),
      weight: 0.35,
      averagePageScore: Math.round(avgExtractability)
    },
    schemaBonus: {
      score: Math.round(schemaBonusScore),
      weight: 0.15,
      pagesWithSchema,
      totalPages
    },
    llmsTxt: {
      score: llmsTxtScore,
      weight: 0.10,
      present: result.hasLlmsTxt
    },
    internalLinking: {
      score: Math.round(internalLinkingScore),
      weight: 0.10,
      averageLinksPerPage: Math.round(avgLinksPerPage),
      orphanPages: 0 // Would need more analysis
    },
    pageTypeCoverage: {
      score: pageTypeCoverageScore,
      weight: 0.10,
      productPages: productCount,
      collectionPages: collectionCount,
      blogPages: blogCount
    },
    robotsTxt: {
      score: robotsScore,
      weight: 0.05,
      present: result.hasRobotsTxt
    },
    sitemap: {
      score: sitemapScore,
      weight: 0.05,
      present: result.hasSitemap
    },
    contentFreshness: {
      score: Math.round(contentFreshnessScore),
      weight: 0.05,
      freshPages,
      totalPages
    },
    brandConsistency: {
      score: brandConsistencyScore,
      weight: 0.05,
      consistentBrandPages: brandNames.size <= 1 ? totalPages : 0,
      totalPages
    }
  };
  
  // Calculate weighted total
  const totalScore = Math.round(
    productExtractabilityScore * 0.35 +
    schemaBonusScore * 0.15 +
    llmsTxtScore * 0.10 +
    internalLinkingScore * 0.10 +
    pageTypeCoverageScore * 0.10 +
    robotsScore * 0.05 +
    sitemapScore * 0.05 +
    contentFreshnessScore * 0.05 +
    brandConsistencyScore * 0.05
  );
  
  return { score: Math.min(100, Math.max(0, totalScore)), breakdown };
}

// ============================================
// LLMS.TXT GENERATION
// ============================================

export function generateLlmsTxt(result: SiteAnalysis): GeneratedLlmsTxt {
  const warnings: string[] = [];
  const mainPage = result.pages[0];

  // Utility page patterns to exclude from categories (exact path segments)
  const utilityPaths = new Set([
    'cart', 'checkout', 'account', 'login', 'register', 'signup', 'signin',
    'search', 'contact', 'help', 'faq', 'terms', 'privacy', 'policy',
    'shipping', 'returns', 'about', 'careers', 'jobs', 'customer',
    'authentication', 'redirect', 'admin', 'api', 'wishlist', 'compare',
    'order', 'orders', 'track', 'feed', 'rss', 'atom', 'sitemap', 'robots',
    'collections', 'products', 'pages', 'blogs', 'blog', 'news', 'category', 'categories',
  ]);

  // Payment providers and common noise to strip from titles
  const titleNoisePatterns = [
    /\s*(American\s*Express|Visa|Mastercard|Maestro|Google\s*Pay|Apple\s*Pay|PayPal|UPI|NetBanking|Credit\s*Card|Debit\s*Card|COD|Cash\s*on\s*Delivery|RuPay|Diners\s*Club|Discover|JCB)+\s*/gi,
    /\s*✓\s*/g,
    /\s*✕\s*/g,
    /\s{2,}/g,
  ];

  function cleanTitle(title: string): string {
    let cleaned = title || "";
    titleNoisePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, " ");
    });
    return cleaned.replace(/^[^\w]+|[^\w]+$/g, "").trim();
  }

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
      products.push(cleanTitle(page.title));
    }
    
    const urlPath = new URL(page.url).pathname;
    const segments = urlPath.split("/").filter(s => s.length > 0 && !s.match(/\.(html|php|asp|xml|json|txt)$/));
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const prevSeg = i > 0 ? segments[i - 1].toLowerCase() : "";
      const normalized = seg.toLowerCase().replace(/[-_]/g, "");
      
      if (seg.length <= 2 || seg.match(/^[0-9]+$/) || seg.match(/^[a-f0-9]{8,}$/i)) continue;
      
      if (utilityPaths.has(seg.toLowerCase()) || utilityPaths.has(normalized)) continue;
      if (normalized.includes('sitemap') || normalized.includes('redirect') || normalized.includes('authentication')) continue;
      
      if (prevSeg === 'collections' || prevSeg === 'category' || prevSeg === 'categories') {
        categories.add(seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
      }
      else if (prevSeg !== 'products' && prevSeg !== 'product' && prevSeg !== 'p') {
        if (seg.length >= 3 && seg.length <= 50 && !seg.match(/^[a-f0-9-]{20,}$/i)) {
          categories.add(seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
        }
      }
    }
  });

  if (products.length === 0) {
    warnings.push("No product schema found - product list may be incomplete");
  }

  // About section
  let about = "";
  if (mainPage?.metaDescription) {
    about = mainPage.metaDescription;
  } else {
    about = `${result.domain} is an e-commerce website.`;
    warnings.push("Limited organization information available");
  }

  // Key pages (prioritize pages with schema, excluding utility pages)
  const excludedPathPatterns = [/\/cart$/i, /\/checkout$/i, /\/search$/i, /\/account$/i, /\/login$/i, /\/authentication$/i, /\/redirect$/i, /\/customer/i];
  
  const keyPages = result.pages
    .filter(p => {
      const path = new URL(p.url).pathname.toLowerCase();
      return !excludedPathPatterns.some(pattern => pattern.test(path));
    })
    .filter(p => p.jsonLdScripts.length > 0 || p.schemas.hasProductSchema || p.title)
    .slice(0, 10)
    .map(p => ({
      title: cleanTitle(p.title) || "Untitled",
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

// ============================================
// SCHEMA GENERATION
// ============================================

export function generateSchemaForPage(page: PageAnalysis): GeneratedSchema[] {
  const schemas: GeneratedSchema[] = [];

  if (page.schemas.hasProductSchema || page.title?.toLowerCase().includes("product") || page.url.includes("/product")) {
    const productSchema = generateProductSchemaFromPage(page);
    if (productSchema) schemas.push(productSchema);
  }

  const breadcrumbSchema = generateBreadcrumbSchemaFromPage(page);
  if (breadcrumbSchema) schemas.push(breadcrumbSchema);

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

  if (page.title) {
    schema.name = page.title;
    fieldsExtracted.push("name");
  } else {
    fieldsMissing.push("name");
    suggestions.push("Add a descriptive product title");
  }

  if (page.metaDescription) {
    schema.description = page.metaDescription;
    fieldsExtracted.push("description");
  } else {
    fieldsMissing.push("description");
    suggestions.push("Add a product description");
  }

  schema.url = page.url;
  fieldsExtracted.push("url");

  if (page.openGraph.image) {
    schema.image = page.openGraph.image;
    fieldsExtracted.push("image");
  } else {
    fieldsMissing.push("image");
    suggestions.push("Add product images");
  }

  // Extract price from content extraction if available
  const price = page.contentExtraction?.price?.value;
  if (price) {
    schema.offers = {
      "@type": "Offer",
      price: price,
      priceCurrency: page.contentExtraction?.price?.currency || "USD",
      availability: "https://schema.org/InStock",
    };
    fieldsExtracted.push("price");
  } else {
    fieldsMissing.push("price");
    suggestions.push("Add product pricing information");
  }

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

  if (mainPage?.title) {
    const name = mainPage.title.split("|")[0].split("-")[0].trim();
    schema.name = name || result.domain;
    fieldsExtracted.push("name");
  } else {
    schema.name = result.domain;
    fieldsMissing.push("name");
    suggestions.push("Add organization name");
  }

  if (mainPage?.metaDescription) {
    schema.description = mainPage.metaDescription;
    fieldsExtracted.push("description");
  } else {
    fieldsMissing.push("description");
    suggestions.push("Add organization description");
  }

  if (mainPage?.openGraph.image) {
    schema.logo = mainPage.openGraph.image;
    fieldsExtracted.push("logo");
  } else {
    fieldsMissing.push("logo");
    suggestions.push("Add organization logo URL");
  }

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

// ============================================
// COMPARISON CONTEXT
// ============================================

/**
 * Provides percentile ranking compared to typical e-commerce sites
 */
export function getComparisonContext(score: number): { percentile: number; label: string; comparedTo: string } {
  // Rough distribution based on typical e-commerce sites
  // Most sites score between 20-60, with few above 80
  let percentile: number;
  let label: string;
  
  if (score >= 80) {
    percentile = 90 + Math.min(10, (score - 80));
    label = "Top 10%";
  } else if (score >= 60) {
    percentile = 70 + ((score - 60) / 20) * 20;
    label = "Top 30%";
  } else if (score >= 40) {
    percentile = 40 + ((score - 40) / 20) * 30;
    label = "Average";
  } else if (score >= 20) {
    percentile = 15 + ((score - 20) / 20) * 25;
    label = "Below Average";
  } else {
    percentile = Math.max(5, score);
    label = "Bottom 10%";
  }
  
  return {
    percentile: Math.round(percentile),
    label,
    comparedTo: "typical e-commerce sites"
  };
}
