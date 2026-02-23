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
  PageType,
  ContentExtraction,
  SiteDiscoverabilityScore,
  SiteDiscoverabilityBreakdown,
  ExtractabilityScore,
  ExtractabilityBreakdown
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
export function calculateExtractabilityScore(
  page: PageAnalysis
): ExtractabilityScore {
  
  const pageType = page.pageType || detectPageType(page.url, page);
  const extraction = page.contentExtraction || extractAllContent(page);
  const identifiers = extractIdentifiers(page.jsonLdScripts);
  
  const breakdown: ExtractabilityBreakdown = {
    identity: {
      productName: { points: 0, max: 10, found: false, source: null },
      description: { points: 0, max: 5, found: false, length: 0 },
      category: { points: 0, max: 5, found: false, value: null },
      totalPoints: 0,
      maxPoints: 20
    },
    pricing: {
      price: { points: 0, max: 12, found: false, value: null, currency: null, source: null },
      currency: { points: 0, max: 3, found: false, symbol: null },
      totalPoints: 0,
      maxPoints: 15
    },
    availability: {
      points: 0,
      max: 10,
      found: false,
      status: "unknown",
      source: null
    },
    reviews: {
      rating: { points: 0, max: 10, found: false, value: null, count: 0, source: null },
      count: { points: 0, max: 10, found: false, value: 0 },
      totalPoints: 0,
      maxPoints: 20
    },
    identifiers: {
      points: 0,
      max: 10,
      hasGTIN: false,
      hasMPN: false,
      hasSKU: false,
      values: { gtin: null, mpn: null, sku: null },
      count: 0
    },
    images: {
      points: 0,
      max: 5,
      count: 0,
      withAlt: 0,
      altRatio: 0
    },
    specifications: {
      points: 0,
      max: 10,
      found: false,
      count: 0,
      source: null
    },
    schemaBonus: {
      points: 0,
      max: 10,
      hasProductSchema: false,
      hasOfferSchema: false,
      hasAggregateRatingSchema: false,
      isComplete: false
    },
    pageContext: {
      detectedType: pageType,
      isApplicable: pageType === "product" || pageType === "collection",
      reason: null
    }
  };
  
  if (pageType !== "product" && pageType !== "collection") {
    breakdown.pageContext.reason = `Scoring only applies to product/collection pages. This is a ${pageType} page.`;
    return { score: 0, max: 100, label: "N/A", breakdown };
  }
  
  // ============================================
  // IDENTITY (20 points)
  // ============================================
  
  // Product Name (10 points) - Schema (10) OR H1 (8) OR title (5)
  if (page.schemas.hasProductSchema && page.title) {
    breakdown.identity.productName.points = 10;
    breakdown.identity.productName.source = "schema";
  } else if (extraction.productName?.source === "h1" && extraction.productName.value) {
    breakdown.identity.productName.points = 8;
    breakdown.identity.productName.source = "h1";
  } else if (extraction.productName?.value) {
    breakdown.identity.productName.points = 5;
    breakdown.identity.productName.source = extraction.productName.source || "content";
  }
  breakdown.identity.productName.found = breakdown.identity.productName.points > 0;
  
  // Description (5 points) - Meta desc >=120 (5) OR >=50 (3)
  const descLength = page.metaDescription?.length || 0;
  breakdown.identity.description.length = descLength;
  if (descLength >= 120) {
    breakdown.identity.description.points = 5;
    breakdown.identity.description.found = true;
  } else if (descLength >= 50) {
    breakdown.identity.description.points = 3;
    breakdown.identity.description.found = true;
  }
  
  // Category (5 points) - Schema breadcrumb (5) OR URL path (3)
  if (page.schemas.hasBreadcrumbSchema && extraction.category?.value) {
    breakdown.identity.category.points = 5;
    breakdown.identity.category.value = extraction.category.value;
    breakdown.identity.category.found = true;
  } else if (extraction.category?.value) {
    breakdown.identity.category.points = 3;
    breakdown.identity.category.value = extraction.category.value;
    breakdown.identity.category.found = true;
  }
  
  breakdown.identity.totalPoints = 
    breakdown.identity.productName.points + 
    breakdown.identity.description.points + 
    breakdown.identity.category.points;
  
  // ============================================
  // PRICING (15 points)
  // ============================================
  
  // Price (12 points) - Schema (12) OR text pattern (10)
  if (page.schemas.hasOfferSchema && extraction.price?.value) {
    breakdown.pricing.price.points = 12;
    breakdown.pricing.price.source = "schema";
    breakdown.pricing.price.found = true;
  } else if (extraction.price?.value) {
    breakdown.pricing.price.points = 10;
    breakdown.pricing.price.source = extraction.price.source || "text";
    breakdown.pricing.price.found = true;
  }
  breakdown.pricing.price.value = extraction.price?.value || null;
  breakdown.pricing.price.currency = extraction.price?.currency || null;
  
  // Currency (3 points) - Schema (3) OR symbol (2)
  if (extraction.price?.currency) {
    if (page.schemas.hasOfferSchema) {
      breakdown.pricing.currency.points = 3;
    } else {
      breakdown.pricing.currency.points = 2;
    }
    breakdown.pricing.currency.symbol = extraction.price.currency;
    breakdown.pricing.currency.found = true;
  }
  
  breakdown.pricing.totalPoints = 
    breakdown.pricing.price.points + 
    breakdown.pricing.currency.points;
  
  // ============================================
  // AVAILABILITY (10 points)
  // ============================================
  
  if (page.schemas.hasOfferSchema) {
    breakdown.availability.points = 10;
    breakdown.availability.found = true;
    breakdown.availability.status = extraction.availability?.status || "in_stock";
    breakdown.availability.source = "schema";
  } else if (extraction.availability?.status && extraction.availability.status !== "unknown") {
    breakdown.availability.points = 8;
    breakdown.availability.found = true;
    breakdown.availability.status = extraction.availability.status;
    breakdown.availability.source = extraction.availability.source || "text";
  } else if (extraction.purchaseCTA?.detected) {
    breakdown.availability.points = 5;
    breakdown.availability.found = true;
    breakdown.availability.status = "in_stock";
    breakdown.availability.source = "cta";
  }
  
  // ============================================
  // REVIEWS (20 points)
  // ============================================
  
  const ratingValue = page.reviews?.averageRating || extraction.rating?.value || null;
  const reviewCount = page.reviews?.reviewCount || extraction.rating?.count || 0;
  
  // Rating (10 points) - Schema (10) OR text pattern (8)
  if (ratingValue !== null) {
    breakdown.reviews.rating.found = true;
    breakdown.reviews.rating.value = ratingValue;
    breakdown.reviews.rating.count = reviewCount;
    
    if (page.schemas.hasAggregateRating) {
      breakdown.reviews.rating.points = 10;
      breakdown.reviews.rating.source = "schema";
    } else {
      breakdown.reviews.rating.points = 8;
      breakdown.reviews.rating.source = extraction.rating?.source || "text";
    }
  }
  
  // Review Count (10 points) - Based on count
  if (reviewCount > 0) {
    breakdown.reviews.count.found = true;
    breakdown.reviews.count.value = reviewCount;
    
    if (reviewCount >= 100) {
      breakdown.reviews.count.points = 10;
    } else if (reviewCount >= 50) {
      breakdown.reviews.count.points = 8;
    } else if (reviewCount >= 10) {
      breakdown.reviews.count.points = 6;
    } else if (reviewCount >= 5) {
      breakdown.reviews.count.points = 4;
    } else {
      breakdown.reviews.count.points = 2;
    }
  }
  
  breakdown.reviews.totalPoints = 
    breakdown.reviews.rating.points + 
    breakdown.reviews.count.points;
  
  // ============================================
  // IDENTIFIERS (10 points)
  // ============================================
  
  breakdown.identifiers.hasGTIN = !!identifiers.gtin;
  breakdown.identifiers.hasMPN = !!identifiers.mpn;
  breakdown.identifiers.hasSKU = !!identifiers.sku;
  breakdown.identifiers.values = {
    gtin: identifiers.gtin || null,
    mpn: identifiers.mpn || null,
    sku: identifiers.sku || null
  };
  breakdown.identifiers.count = [identifiers.gtin, identifiers.mpn, identifiers.sku].filter(Boolean).length;
  
  if (identifiers.gtin) {
    breakdown.identifiers.points = 10; // GTIN is most valuable
  } else if (identifiers.mpn) {
    breakdown.identifiers.points = 7;
  } else if (identifiers.sku) {
    breakdown.identifiers.points = 5;
  }
  
  // ============================================
  // IMAGES (5 points)
  // ============================================
  
  const imageCount = page.images?.total || extraction.images?.count || 0;
  const withAlt = page.images?.withAlt || extraction.images?.hasAlt || 0;
  const altRatio = imageCount > 0 ? withAlt / imageCount : 0;
  
  breakdown.images.count = imageCount;
  breakdown.images.withAlt = withAlt;
  breakdown.images.altRatio = altRatio;
  
  if (imageCount >= 3 && altRatio >= 0.8) {
    breakdown.images.points = 5;
  } else if (imageCount >= 2 && altRatio >= 0.5) {
    breakdown.images.points = 4;
  } else if (imageCount >= 1 && altRatio >= 0.5) {
    breakdown.images.points = 3;
  } else if (imageCount >= 1) {
    breakdown.images.points = 2;
  }
  
  // ============================================
  // SPECIFICATIONS (10 points)
  // ============================================
  
  if (extraction.specifications?.detected) {
    breakdown.specifications.found = true;
    breakdown.specifications.count = extraction.specifications.count;
    breakdown.specifications.source = extraction.specifications.source;
    
    if (extraction.specifications.count >= 5) {
      breakdown.specifications.points = 10;
    } else if (extraction.specifications.count >= 3) {
      breakdown.specifications.points = 7;
    } else {
      breakdown.specifications.points = 5;
    }
  }
  
  // ============================================
  // SCHEMA BONUS (10 points)
  // ============================================
  
  breakdown.schemaBonus.hasProductSchema = page.schemas.hasProductSchema;
  breakdown.schemaBonus.hasOfferSchema = page.schemas.hasOfferSchema;
  breakdown.schemaBonus.hasAggregateRatingSchema = page.schemas.hasAggregateRating;
  
  if (page.schemas.hasProductSchema && page.schemas.hasOfferSchema && page.schemas.hasAggregateRating) {
    breakdown.schemaBonus.points = 10;
    breakdown.schemaBonus.isComplete = true;
  } else if (page.schemas.hasProductSchema && page.schemas.hasOfferSchema) {
    breakdown.schemaBonus.points = 8;
  } else if (page.schemas.hasProductSchema) {
    breakdown.schemaBonus.points = 5;
  }
  
  // ============================================
  // CALCULATE TOTAL (Max 100)
  // ============================================
  
  const totalScore = Math.min(100, 
    breakdown.identity.totalPoints +
    breakdown.pricing.totalPoints +
    breakdown.availability.points +
    breakdown.reviews.totalPoints +
    breakdown.identifiers.points +
    breakdown.images.points +
    breakdown.specifications.points +
    breakdown.schemaBonus.points
  );
  
  const label = totalScore >= 80 ? "Excellent" : 
                totalScore >= 60 ? "Good" : 
                totalScore >= 40 ? "Fair" : 
                "Poor";
  
  return { score: totalScore, max: 100, label, breakdown };
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

// ============================================
// URL TYPE DETECTION
// ============================================

export type UrlType = "domain" | "product" | "collection";

/**
 * Detects if the entered URL is a domain, product page, or collection
 */
export function detectUrlType(url: string): {
  type: UrlType;
  domain: string;
  isProductPage: boolean;
  isHomepage: boolean;
  isCollection: boolean;
} {
  const urlObj = new URL(url);
  const urlPath = urlObj.pathname.toLowerCase();
  const domain = urlObj.hostname;
  
  // Homepage = domain
  if (urlPath === "/" || urlPath === "") {
    return { type: "domain", domain, isProductPage: false, isHomepage: true, isCollection: false };
  }
  
  // Product page patterns
  const productPatterns = [
    /\/products?\//i,
    /\/p\//i,
    /\/dp\//i,
    /\/item\//i,
    /\/product-/i,
    /\?product=/i,
    /\/[a-z0-9]+\/p-[a-z0-9]+/i,
  ];
  
  if (productPatterns.some(p => p.test(urlPath))) {
    return { type: "product", domain, isProductPage: true, isHomepage: false, isCollection: false };
  }
  
  // Collection patterns
  const collectionPatterns = [
    /\/collections?\//i,
    /\/categories?\//i,
    /\/category\//i,
    /\/c\//i,
    /\/shop\//i,
    /\/catalog\//i,
  ];
  
  if (collectionPatterns.some(p => p.test(urlPath))) {
    return { type: "collection", domain, isProductPage: false, isHomepage: false, isCollection: true };
  }
  
  return { type: "domain", domain, isProductPage: false, isHomepage: false, isCollection: false };
}

// ============================================
// AI CRAWLER ACCESS CHECK
// ============================================

/**
 * Checks if robots.txt allows AI crawlers (OAI-SearchBot, GPTBot, ChatGPT-User)
 */
export function checkAICrawlerAccess(robotsTxt: string | null): {
  allowsOAI: boolean;
  allowsGPTBot: boolean;
  allowsChatGPTUser: boolean;
  hasRobotsTxt: boolean;
  details: string;
} {
  if (!robotsTxt) {
    return {
      allowsOAI: true,
      allowsGPTBot: true,
      allowsChatGPTUser: true,
      hasRobotsTxt: false,
      details: "No robots.txt found - all crawlers allowed by default",
    };
  }
  
  const lines = robotsTxt.split("\n");
  const blocked: Record<string, boolean> = {
    oai: false,
    gptbot: false,
    chatgpt: false,
    all: false,
  };
  
  let currentUserAgent = "";
  
  for (const line of lines) {
    const trimmed = line.trim();
    const lowerLine = trimmed.toLowerCase();
    
    if (lowerLine.startsWith("user-agent:")) {
      currentUserAgent = lowerLine.substring(11).trim();
    } else if (lowerLine.startsWith("disallow:")) {
      const path = trimmed.substring(9).trim();
      if (path === "/" || path === "/*") {
        if (currentUserAgent === "*" || currentUserAgent === "") {
          blocked.all = true;
        }
        if (currentUserAgent === "oai-searchbot") blocked.oai = true;
        if (currentUserAgent === "gptbot") blocked.gptbot = true;
        if (currentUserAgent === "chatgpt-user") blocked.chatgpt = true;
      }
    }
  }
  
  // If * is blocked, specific bots inherit unless explicitly allowed
  const allowsOAI = !blocked.oai && !blocked.all;
  const allowsGPTBot = !blocked.gptbot && !blocked.all;
  const allowsChatGPTUser = !blocked.chatgpt && !blocked.all;
  
  const details: string[] = [];
  if (!allowsOAI) details.push("OAI-SearchBot blocked");
  if (!allowsGPTBot) details.push("GPTBot blocked");
  if (!allowsChatGPTUser) details.push("ChatGPT-User blocked");
  if (details.length === 0) details.push("All AI crawlers allowed");
  
  return {
    allowsOAI,
    allowsGPTBot,
    allowsChatGPTUser,
    hasRobotsTxt: true,
    details: details.join(", "),
  };
}

// ============================================
// IDENTIFIER EXTRACTION
// ============================================

/**
 * Extracts GTIN, MPN, SKU from schema and content
 */
export function extractIdentifiers(
  jsonLdScripts: unknown[],
  bodyText?: string
): {
  gtin: string | null;
  mpn: string | null;
  sku: string | null;
} {
  let gtin: string | null = null;
  let mpn: string | null = null;
  let sku: string | null = null;
  
  for (const schema of jsonLdScripts) {
    if (typeof schema === "object" && schema !== null) {
      const s = schema as Record<string, unknown>;
      if (s["gtin"] && !gtin) gtin = String(s["gtin"]);
      if (s["gtin13"] && !gtin) gtin = String(s["gtin13"]);
      if (s["gtin14"] && !gtin) gtin = String(s["gtin14"]);
      if (s["gtin8"] && !gtin) gtin = String(s["gtin8"]);
      if (s["mpn"] && !mpn) mpn = String(s["mpn"]);
      if (s["sku"] && !sku) sku = String(s["sku"]);
      if (s["productID"] && !sku) sku = String(s["productID"]);
    }
  }
  
  // Try content patterns if not found in schema
  if (bodyText) {
    if (!gtin) {
      const gtinMatch = bodyText.match(/(?:GTIN|EAN|UPC)[:\s]*(\d{8,14})/i);
      if (gtinMatch) gtin = gtinMatch[1];
    }
    if (!mpn) {
      const mpnMatch = bodyText.match(/(?:MPN|Manufacturer\s*Part)[:\s]*([A-Z0-9][A-Z0-9-]+)/i);
      if (mpnMatch) mpn = mpnMatch[1];
    }
    if (!sku) {
      const skuMatch = bodyText.match(/(?:SKU|Item\s*#)[:\s]*([A-Z0-9][A-Z0-9-]+)/i);
      if (skuMatch) sku = skuMatch[1];
    }
  }
  
  return { gtin, mpn, sku };
}

// ============================================
// SITE DISCOVERABILITY SCORE
// ============================================

/**
 * Evaluates llms.txt content quality
 */
function evaluateLlmsTxtQuality(content: string): "complete" | "partial" | "missing" {
  const hasSections = {
    tagline: /^>\s*.+/m.test(content),
    products: /^##\s*Products/mi.test(content),
    categories: /^##\s*Categories/mi.test(content),
    about: /^##\s*About/mi.test(content),
    keyPages: /^##\s*Key\s*Pages/mi.test(content),
  };
  
  const sectionCount = Object.values(hasSections).filter(Boolean).length;
  
  if (sectionCount >= 4) return "complete";
  if (sectionCount >= 2) return "partial";
  return "missing";
}

/**
 * Calculates Site Discoverability Score
 * Question: Can LLMs discover your brand when users search for products in your category?
 */
export function calculateSiteDiscoverabilityScore(params: {
  robotsTxt: string | null;
  aiCrawlerAccess: ReturnType<typeof checkAICrawlerAccess>;
  llmsTxt: string | null;
  hasSitemap: boolean;
  sitemapProductCount: number;
  organizationSchema: {
    present: boolean;
    hasName: boolean;
    hasLogo: boolean;
    hasSameAs: boolean;
    hasDescription: boolean;
  };
  categories: string[];
  brandVariations: string[];
  isHttps: boolean;
}): SiteDiscoverabilityScore {
  const breakdown: SiteDiscoverabilityBreakdown = {
    llmsTxt: {
      points: 0,
      max: 20,
      present: false,
      hasContent: false,
      hasCategories: false,
      hasProducts: false,
      quality: "missing",
    },
    aiCrawlerAccess: {
      points: 0,
      max: 15,
      allowsOAI: false,
      allowsGPTBot: false,
      allowsChatGPTUser: false,
      hasRobotsTxt: false,
      details: "",
    },
    sitemap: {
      points: 0,
      max: 15,
      present: false,
      productCount: 0,
      urlCount: 0,
    },
    organizationSchema: {
      points: 0,
      max: 15,
      present: false,
      hasName: false,
      hasLogo: false,
      hasSameAs: false,
      hasDescription: false,
    },
    categoryPresence: {
      points: 0,
      max: 10,
      categories: [],
      count: 0,
    },
    brandConsistency: {
      points: 0,
      max: 10,
      consistent: false,
      brandVariations: [],
      dominantBrand: null,
    },
    technicalHealth: {
      points: 0,
      max: 10,
      https: false,
      accessible: false,
      noMajorErrors: true,
    },
    externalMentions: {
      measurable: false,
      importance: "high",
      weight: "15%",
      recommendation: "Get mentioned on Reddit, review sites, and forums. Third-party mentions are a strong signal for LLM discoverability.",
    },
    domainAuthority: {
      measurable: false,
      importance: "medium",
      weight: "10%",
      recommendation: "Build backlinks and get featured in Wikipedia and industry publications.",
    },
  };
  
  let totalScore = 0;
  
  // 1. llms.txt (20 points)
  if (params.llmsTxt) {
    breakdown.llmsTxt.present = true;
    breakdown.llmsTxt.hasContent = params.llmsTxt.length > 50;
    breakdown.llmsTxt.hasCategories = /##\s*Categories/i.test(params.llmsTxt);
    breakdown.llmsTxt.hasProducts = /##\s*Products/i.test(params.llmsTxt);
    
    const quality = evaluateLlmsTxtQuality(params.llmsTxt);
    breakdown.llmsTxt.quality = quality;
    
    if (quality === "complete") {
      breakdown.llmsTxt.points = 20;
    } else if (quality === "partial") {
      breakdown.llmsTxt.points = 12;
    } else {
      breakdown.llmsTxt.points = 5;
    }
    totalScore += breakdown.llmsTxt.points;
  }
  
  // 2. AI Crawler Access (15 points)
  breakdown.aiCrawlerAccess = {
    ...params.aiCrawlerAccess,
    points: 0,
    max: 15,
  };
  const crawlerScore = 
    (params.aiCrawlerAccess.allowsOAI ? 5 : 0) +
    (params.aiCrawlerAccess.allowsGPTBot ? 5 : 0) +
    (params.aiCrawlerAccess.allowsChatGPTUser ? 5 : 0);
  breakdown.aiCrawlerAccess.points = crawlerScore;
  totalScore += crawlerScore;
  
  // 3. Sitemap (15 points)
  breakdown.sitemap.present = params.hasSitemap;
  breakdown.sitemap.productCount = params.sitemapProductCount;
  if (params.hasSitemap) {
    if (params.sitemapProductCount > 100) {
      breakdown.sitemap.points = 15;
    } else if (params.sitemapProductCount > 20) {
      breakdown.sitemap.points = 10;
    } else {
      breakdown.sitemap.points = 5;
    }
    totalScore += breakdown.sitemap.points;
  }
  
  // 4. Organization Schema (15 points)
  breakdown.organizationSchema = { ...params.organizationSchema, points: 0, max: 15 };
  if (params.organizationSchema.present) {
    let orgScore = 0;
    if (params.organizationSchema.hasName) orgScore += 5;
    if (params.organizationSchema.hasLogo) orgScore += 4;
    if (params.organizationSchema.hasSameAs) orgScore += 4;
    if (params.organizationSchema.hasDescription) orgScore += 2;
    breakdown.organizationSchema.points = orgScore;
    totalScore += orgScore;
  }
  
  // 5. Category Presence (10 points)
  breakdown.categoryPresence.categories = params.categories;
  breakdown.categoryPresence.count = params.categories.length;
  if (params.categories.length > 0) {
    breakdown.categoryPresence.points = Math.min(10, params.categories.length * 2);
    totalScore += breakdown.categoryPresence.points;
  }
  
  // 6. Brand Consistency (10 points)
  breakdown.brandConsistency.brandVariations = params.brandVariations;
  breakdown.brandConsistency.consistent = params.brandVariations.length <= 1;
  breakdown.brandConsistency.dominantBrand = params.brandVariations[0] || null;
  if (params.brandVariations.length === 1) {
    breakdown.brandConsistency.points = 10;
    totalScore += 10;
  } else if (params.brandVariations.length <= 3) {
    breakdown.brandConsistency.points = 5;
    totalScore += 5;
  }
  
  // 7. Technical Health (10 points)
  breakdown.technicalHealth.https = params.isHttps;
  breakdown.technicalHealth.accessible = true;
  if (params.isHttps) {
    breakdown.technicalHealth.points = 10;
    totalScore += 10;
  }
  
  const label = totalScore >= 80 ? "Excellent" : totalScore >= 60 ? "Good" : totalScore >= 40 ? "Fair" : "Poor";
  
  return {
    score: Math.min(100, totalScore),
    max: 100,
    label,
    breakdown,
  };
}

// ============================================
// PRODUCT EXTRACTABILITY SCORE
// ============================================


