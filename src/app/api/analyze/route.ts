import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import https from "https";
import { 
  calculateProductExtractabilityScore,
  calculateSiteDiscoverabilityScore,
  calculatePageScore,
  generateLlmsTxt, 
  generateSchemaForPage,
  generateOrganizationSchema,
  detectPageType,
  detectUrlType,
  extractAllContent,
  checkAICrawlerAccess,
  getComparisonContext,
  extractIdentifiers
} from "@/lib/schema-generator";
import { PageAnalysis, SiteAnalysis, UrlType } from "@/lib/types";

const FETCH_TIMEOUT = 15000;
const DEFAULT_MAX_PAGES = 100;
const MAX_PAGES_HARD_LIMIT = 1000;
const MAX_REDIRECTS = 10;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const fetchHeaders = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

interface FetchResult {
  content: string;
  finalUrl: string;
  redirectChain: string[];
}

async function fetchWithTimeout(url: string, options: Record<string, unknown> = {}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  
  try {
    const isHttps = url.startsWith("https");
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      agent: isHttps ? httpsAgent : undefined,
    } as any);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Follows redirects and returns both content and final URL.
 * Handles short URLs like amzn.in/d/xxx which redirect to full product pages.
 */
async function fetchWithRedirects(
  url: string, 
  options: Record<string, unknown> = {},
  maxRedirects: number = MAX_REDIRECTS
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  const redirectChain: string[] = [url];
  let currentUrl = url;
  let redirects = 0;
  
  try {
    while (redirects <= maxRedirects) {
      const isHttps = currentUrl.startsWith("https");
      
      const response = await fetch(currentUrl, {
        ...options,
        signal: controller.signal,
        agent: isHttps ? httpsAgent : undefined,
        redirect: "manual", // Handle redirects manually to track chain
      } as any);
      
      // Check for redirect status codes
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error(`Redirect ${response.status} without location header`);
        }
        
        // Resolve relative URLs
        const nextUrl = new URL(location, currentUrl).href;
        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
        redirects++;
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Success - return content and final URL
      const content = await response.text();
      clearTimeout(timeout);
      
      return {
        content,
        finalUrl: currentUrl,
        redirectChain,
      };
    }
    
    throw new Error(`Too many redirects (>${maxRedirects})`);
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Resolves a short URL to its final destination URL.
 * Returns the final URL without fetching the full content.
 * Uses GET request since many short URL services don't respond to HEAD.
 */
async function resolveShortUrl(url: string): Promise<{ finalUrl: string; redirectChain: string[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const redirectChain: string[] = [url];
  let currentUrl = url;
  let redirects = 0;
  
  try {
    while (redirects <= MAX_REDIRECTS) {
      const isHttps = currentUrl.startsWith("https");
      
      const response = await fetch(currentUrl, {
        method: "GET", // Use GET - many short URL services ignore HEAD
        signal: controller.signal,
        agent: isHttps ? httpsAgent : undefined,
        redirect: "manual",
        headers: fetchHeaders,
      } as any);
      
      // Check for redirect status codes
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) break;
        
        const nextUrl = new URL(location, currentUrl).href;
        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
        redirects++;
        
        // Consume the body to avoid memory leaks
        try { await response.text(); } catch {}
        continue;
      }
      
      // Success - consume body and return
      try { await response.text(); } catch {}
      break;
    }
    
    clearTimeout(timeout);
    return { finalUrl: currentUrl, redirectChain };
  } catch (error) {
    clearTimeout(timeout);
    console.log(`resolveShortUrl error for ${url}:`, error);
    return { finalUrl: url, redirectChain };
  }
}

function parseSitemapsFromRobotsTxt(robotsTxt: string, origin: string): string[] {
  const sitemaps: string[] = [];
  const lines = robotsTxt.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("sitemap:")) {
      const sitemapUrl = trimmed.substring(8).trim();
      if (sitemapUrl) {
        sitemaps.push(sitemapUrl);
      }
    }
  }
  
  return sitemaps;
}

async function discoverSitemaps(origin: string, robotsTxt: string | null): Promise<string[]> {
  const sitemapUrls: string[] = [];
  
  if (robotsTxt) {
    const robotsSitemaps = parseSitemapsFromRobotsTxt(robotsTxt, origin);
    sitemapUrls.push(...robotsSitemaps);
  }
  
  const commonSitemapPaths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap-index.xml",
    "/sitemap-0.xml",
    "/sitemap1.xml",
    "/sitemap.txt",
    "/sitemap/",
  ];
  
  for (const path of commonSitemapPaths) {
    const url = `${origin}${path}`;
    if (!sitemapUrls.includes(url)) {
      sitemapUrls.push(url);
    }
  }
  
  const validSitemaps: string[] = [];
  for (const url of sitemapUrls) {
    try {
      const content = await fetchWithTimeout(url);
      if (content && (content.includes("<urlset") || content.includes("<sitemapindex") || content.includes("<?xml"))) {
        validSitemaps.push(url);
      }
    } catch {}
  }
  
  return validSitemaps;
}

export async function POST(request: NextRequest) {
  try {
    const { url, maxPages } = await request.json();
    const pageLimit = Math.min(maxPages || DEFAULT_MAX_PAGES, MAX_PAGES_HARD_LIMIT);

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Resolve short URLs (e.g., amzn.in/d/xxx -> full Amazon product URL)
    console.log(`Resolving URL: ${url}`);
    let { finalUrl, redirectChain } = await resolveShortUrl(url);
    let wasRedirected = finalUrl !== url;
    
    // Known short URL domains that often need GET-based redirect resolution
    const shortUrlDomains = [
      'amzn.in', 'amzn.to', 'amzn.eu', 'amazon.ae',
      'bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'ow.ly',
      'short.link', 'rb.gy', 'cutt.ly', 'bl.ink',
    ];
    
    const originalDomain = new URL(url).hostname.toLowerCase();
    const isShortUrl = shortUrlDomains.some(d => originalDomain === d || originalDomain.endsWith('.' + d));
    
    // If it looks like a short URL but wasn't resolved, try fetching with redirects
    if (isShortUrl && !wasRedirected) {
      console.log(`Detected potential short URL, trying full fetch with redirects...`);
      try {
        const result = await fetchWithRedirects(url, { headers: fetchHeaders });
        if (result.finalUrl !== url) {
          finalUrl = result.finalUrl;
          redirectChain = result.redirectChain;
          wasRedirected = true;
        }
      } catch (e) {
        console.log(`Full redirect fetch failed:`, e);
      }
    }
    
    if (wasRedirected) {
      console.log(`Redirect: ${url} -> ${finalUrl}`);
      console.log(`Chain: ${redirectChain.join(' -> ')}`);
    }

    const baseUrl = new URL(finalUrl);
    const domain = baseUrl.hostname;
    const finalDomain = domain;

    let robotsTxt: string | null = null;
    try {
      robotsTxt = await fetchWithTimeout(`${baseUrl.origin}/robots.txt`);
    } catch {}

    const sitemapUrls = await discoverSitemaps(baseUrl.origin, robotsTxt);
    
    let sitemapXml: string | null = null;
    const sitemapContents: string[] = [];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const content = await fetchWithTimeout(sitemapUrl);
        sitemapContents.push(content);
        if (!sitemapXml) {
          sitemapXml = content;
        }
      } catch {}
    }

    let llmsTxt: string | null = null;
    try {
      llmsTxt = await fetchWithTimeout(`${baseUrl.origin}/llms.txt`);
    } catch {}

    let pageUrls = await discoverPages(baseUrl.href, sitemapContents, robotsTxt, pageLimit);
    
    // Ensure the final URL (after redirect) is included in pages to analyze
    if (!pageUrls.includes(finalUrl)) {
      pageUrls = [finalUrl, ...pageUrls];
    }

    const pages: PageAnalysis[] = [];
    const seenUrls = new Set<string>();

    for (const pageUrl of pageUrls) {
      if (seenUrls.has(pageUrl)) continue;
      seenUrls.add(pageUrl);

      try {
        const { content: html, finalUrl: resolvedUrl } = await fetchWithRedirects(pageUrl, { headers: fetchHeaders });
        seenUrls.add(resolvedUrl);
        const $ = cheerio.load(html);
        const analysis = analyzePage($, resolvedUrl, domain);
        pages.push(analysis);
      } catch (e) {
        console.error(`Failed to analyze ${pageUrl}:`, e);
      }
    }

    // Check if we need to discover product pages for accurate Product Extractability scoring
    const urlTypeAnalysis = detectUrlType(finalUrl);
    const hasProductPages = pages.some(p => p.pageType === "product");
    
    if (urlTypeAnalysis.type === "domain" && !hasProductPages && pages.length > 0) {
      console.log("No product pages found, discovering from homepage links...");
      const productLinks = await discoverProductPageLinks(finalUrl, pages[0]?.links || []);
      
      for (const productUrl of productLinks.slice(0, 5)) {
        if (seenUrls.has(productUrl)) continue;
        seenUrls.add(productUrl);
        
        try {
          const { content: html, finalUrl: resolvedUrl } = await fetchWithRedirects(productUrl, { headers: fetchHeaders });
          seenUrls.add(resolvedUrl);
          const $ = cheerio.load(html);
          const analysis = analyzePage($, resolvedUrl, domain);
          if (analysis.pageType === "product") {
            pages.push(analysis);
            console.log(`Found product page: ${resolvedUrl}`);
          }
        } catch (e) {
          console.error(`Failed to analyze product page ${productUrl}:`, e);
        }
      }
    }

    const analysis = aggregateResults(pages, domain, robotsTxt, sitemapXml, llmsTxt, sitemapUrls);
    
    // Add redirect info to the response if there was a redirect
    if (wasRedirected) {
      (analysis as any).resolvedUrl = {
        original: url,
        final: finalUrl,
        originalDomain,
        finalDomain: domain,
        chain: redirectChain,
      };
      // Update mainUrl to show final URL
      analysis.mainUrl = finalUrl;
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: `Failed to analyze website: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

async function discoverPages(baseUrl: string, sitemapContents: string[], robotsTxt: string | null, limit: number): Promise<string[]> {
  const urls: string[] = [baseUrl];
  const baseOrigin = new URL(baseUrl).origin;

  for (const sitemapXml of sitemapContents) {
    if (sitemapXml) {
      const sitemapUrls = await parseSitemapRecursive(sitemapXml, baseOrigin);
      urls.push(...sitemapUrls);
    }
  }

  if (urls.length < limit) {
    try {
      const html = await fetchWithTimeout(baseUrl, { headers: fetchHeaders });
      const $ = cheerio.load(html);
      const baseHostname = new URL(baseUrl).hostname;

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        try {
          const linkUrl = new URL(href, baseUrl);
          if (linkUrl.hostname === baseHostname && 
              !linkUrl.hash && 
              !linkUrl.pathname.includes("/blog/page/") &&
              !linkUrl.searchParams.has("page") &&
              !linkUrl.pathname.endsWith(".pdf") &&
              !linkUrl.pathname.endsWith(".jpg") &&
              !linkUrl.pathname.endsWith(".png")) {
            urls.push(linkUrl.href);
          }
        } catch {}
      });
    } catch {}
  }

  return [...new Set(urls)].slice(0, limit);
}

async function discoverProductPageLinks(baseUrl: string, knownLinks: string[]): Promise<string[]> {
  const productUrls: string[] = [];
  const productPatterns = [
    /\/products?\//i,
    /\/p\//i,
    /\/dp\//i,
    /\/item\//i,
    /\/product-/i,
    /\?product=/i,
    /\/[a-z0-9-]+\/p-[a-z0-9]+/i,
    /\/shop\//i,
    /\/buy\//i,
  ];

  for (const link of knownLinks) {
    try {
      const linkUrl = new URL(link, baseUrl);
      if (productPatterns.some(p => p.test(linkUrl.pathname))) {
        productUrls.push(linkUrl.href);
      }
    } catch {}
  }

  if (productUrls.length === 0) {
    try {
      const html = await fetchWithTimeout(baseUrl, { headers: fetchHeaders });
      const $ = cheerio.load(html);
      const baseHostname = new URL(baseUrl).hostname;

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        try {
          const linkUrl = new URL(href, baseUrl);
          if (linkUrl.hostname === baseHostname && 
              productPatterns.some(p => p.test(linkUrl.pathname))) {
            productUrls.push(linkUrl.href);
          }
        } catch {}
      });
    } catch {}
  }

  return [...new Set(productUrls)];
}

async function parseSitemapRecursive(xml: string, baseOrigin: string): Promise<string[]> {
  const urls: string[] = [];
  
  const urlMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  for (const match of urlMatches) {
    const url = match.replace(/<\/?loc>/g, "").trim();
    if (url.endsWith(".xml")) {
      try {
        const subSitemap = await fetchWithTimeout(url);
        const subUrls = await parseSitemapRecursive(subSitemap, baseOrigin);
        urls.push(...subUrls);
      } catch {}
    } else if (url.startsWith(baseOrigin) || url.startsWith("http")) {
      urls.push(url);
    }
  }

  return urls;
}

function analyzePage($: cheerio.CheerioAPI, url: string, domain: string): PageAnalysis {
  const title = $("title").text() || "";
  const metaDescription = $('meta[name="description"]').attr("content") || "";

  const jsonLdScripts: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        jsonLdScripts.push(JSON.parse(content));
      }
    } catch {}
  });

  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    openGraph[property.replace("og:", "")] = content;
  });

  const headings = {
    h1: $("h1").length,
    h2: $("h2").length,
    h3: $("h3").length,
    h4: $("h4").length,
    h5: $("h5").length,
    h6: $("h6").length,
  };

  const h1Texts: string[] = [];
  $("h1").each((_, el) => {
    h1Texts.push($(el).text().trim());
  });

  const images = $("img").length;
  const imagesWithAlt = $('img[alt]').length;

  const semanticElements = {
    article: $("article").length,
    section: $("section").length,
    nav: $("nav").length,
    main: $("main").length,
    aside: $("aside").length,
    header: $("header").length,
    footer: $("footer").length,
  };

  const bodyText = $("body").text();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  const links: string[] = [];
  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === domain) {
        links.push(linkUrl.href);
        internalLinks++;
      } else {
        externalLinks++;
      }
    } catch {}
  });

  // Extract breadcrumbs
  const breadcrumbs: string[] = [];
  $("nav[aria-label*='breadcrumb'], .breadcrumb, [itemtype*='BreadcrumbList']").find("a").each((_, el) => {
    const text = $(el).text().trim();
    if (text) breadcrumbs.push(text);
  });
  if (breadcrumbs.length === 0) {
    // Fallback: extract from URL path
    const urlPath = new URL(url).pathname;
    const segments = urlPath.split("/").filter(s => s.length > 0);
    segments.forEach(seg => {
      if (!seg.match(/^[0-9]+$/) && seg.length > 2) {
        breadcrumbs.push(seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
      }
    });
  }

  const freshness = detectFreshness($, jsonLdScripts);

  const hasProductSchema = jsonLdScripts.some(
    (schema: any) => schema["@type"] === "Product" || 
      (Array.isArray(schema["@type"]) && schema["@type"].includes("Product"))
  );

  const hasOrganizationSchema = jsonLdScripts.some(
    (schema: any) => schema["@type"] === "Organization" || 
      schema["@type"] === "LocalBusiness"
  );

  const hasFAQSchema = jsonLdScripts.some(
    (schema: any) => schema["@type"] === "FAQPage"
  );

  const hasBreadcrumbSchema = jsonLdScripts.some(
    (schema: any) => schema["@type"] === "BreadcrumbList"
  );

  const hasReviewSchema = jsonLdScripts.some(
    (schema: any) => schema["@type"] === "Review" || 
      (Array.isArray(schema["@type"]) && schema["@type"].includes("Review"))
  );

  const hasAggregateRating = jsonLdScripts.some(
    (schema: any) => schema["aggregateRating"] || schema["@type"] === "AggregateRating"
  );

  const hasOfferSchema = jsonLdScripts.some(
    (schema: any) => schema["offers"] || schema["@type"] === "Offer"
  );

  let reviewCount = 0;
  let averageRating: number | null = null;
  let ratingCount = 0;

  jsonLdScripts.forEach((schema: any) => {
    if (schema["aggregateRating"]) {
      const agg = schema["aggregateRating"];
      averageRating = agg["ratingValue"] ? parseFloat(agg["ratingValue"]) : null;
      ratingCount = agg["reviewCount"] ? parseInt(agg["reviewCount"]) : 
                    agg["ratingCount"] ? parseInt(agg["ratingCount"]) : 0;
    }
    if (schema["@type"] === "AggregateRating") {
      averageRating = schema["ratingValue"] ? parseFloat(schema["ratingValue"]) : null;
      ratingCount = schema["reviewCount"] ? parseInt(schema["reviewCount"]) : 
                    schema["ratingCount"] ? parseInt(schema["ratingCount"]) : 0;
    }
    if (schema["review"]) {
      const reviews = Array.isArray(schema["review"]) ? schema["review"] : [schema["review"]];
      reviewCount = reviews.length;
    }
    if (Array.isArray(schema) && schema.some((s: any) => s["@type"] === "Review")) {
      reviewCount = schema.filter((s: any) => s["@type"] === "Review").length;
    }
  });

  const hasReviews = reviewCount > 0 || ratingCount > 0 || hasReviewSchema || hasAggregateRating;

  const hasArticleSchema = jsonLdScripts.some(
    (schema: any) => schema["@type"] === "Article" || 
      schema["@type"] === "BlogPosting" ||
      schema["@type"] === "NewsArticle"
  );

  const hasAuthorSchema = jsonLdScripts.some(
    (schema: any) => schema["@type"] === "Person" ||
      schema["author"] ||
      (Array.isArray(schema["@type"]) && schema["@type"].includes("Person"))
  );

  const author = detectAuthor($, jsonLdScripts);

  const quoteReadySnippets = extractQuoteReadySnippets(bodyText);

  // Detect page type (using partial data)
  const pageType = detectPageType(url, {
    schemas: {
      hasProductSchema,
      hasOrganizationSchema,
      hasFAQSchema,
      hasBreadcrumbSchema,
      hasReviewSchema,
      hasAggregateRating,
      hasArticleSchema,
      hasAuthorSchema,
      hasOfferSchema,
    },
  } as Partial<PageAnalysis>);

  // Extract content patterns for scoring
  const contentExtraction = extractAllContent({
    url,
    title,
    metaDescription,
    h1Texts,
    images: { total: images, withAlt: imagesWithAlt, withoutAlt: images - imagesWithAlt },
    semanticElements,
    schemas: {
      hasProductSchema,
      hasOrganizationSchema,
      hasFAQSchema,
      hasBreadcrumbSchema,
      hasReviewSchema,
      hasAggregateRating,
      hasArticleSchema,
      hasAuthorSchema,
      hasOfferSchema,
    },
    reviews: {
      hasReviews,
      reviewCount,
      averageRating,
      ratingCount,
    },
    breadcrumbs,
    openGraph,
    freshness,
  } as Partial<PageAnalysis>);

  const pageData = {
    url,
    title,
    metaDescription,
    jsonLdScripts,
    openGraph,
    headings,
    h1Texts,
    images: { total: images, withAlt: imagesWithAlt, withoutAlt: images - imagesWithAlt },
    semanticElements,
    wordCount,
    schemas: {
      hasProductSchema,
      hasOrganizationSchema,
      hasFAQSchema,
      hasBreadcrumbSchema,
      hasReviewSchema,
      hasAggregateRating,
      hasArticleSchema,
      hasAuthorSchema,
      hasOfferSchema,
    },
    reviews: {
      hasReviews,
      reviewCount,
      averageRating,
      ratingCount,
    },
    quoteReadySnippets,
    freshness,
    author,
    links: [...new Set(links)].slice(0, 50),
    internalLinks,
    externalLinks,
    pageType,
    breadcrumbs,
    contentExtraction,
  };

  const { score, breakdown } = calculatePageScore(pageData as any);

  return {
    ...pageData,
    score,
    scoreBreakdown: breakdown,
  };
}

function detectFreshness($: cheerio.CheerioAPI, jsonLdScripts: unknown[]): PageAnalysis["freshness"] {
  let publishedDate: string | null = null;
  let modifiedDate: string | null = null;

  // Check for article/blog dates
  const ogPublished = $('meta[property="article:published_time"]').attr("content");
  const ogModified = $('meta[property="article:modified_time"]').attr("content");
  const schemaDatePublished = $('meta[itemprop="datePublished"]').attr("content");
  const schemaDateModified = $('meta[itemprop="dateModified"]').attr("content");
  const timeElement = $("time[datetime]").first().attr("datetime");

  if (ogPublished) publishedDate = ogPublished;
  if (schemaDatePublished && !publishedDate) publishedDate = schemaDatePublished;
  if (timeElement && !publishedDate) publishedDate = timeElement;

  if (ogModified) modifiedDate = ogModified;
  if (schemaDateModified && !modifiedDate) modifiedDate = schemaDateModified;

  // Check JSON-LD schemas for dates
  jsonLdScripts.forEach((schema: any) => {
    if (schema["datePublished"] && !publishedDate) {
      publishedDate = schema["datePublished"];
    }
    if (schema["dateModified"] && !modifiedDate) {
      modifiedDate = schema["dateModified"];
    }
    if (schema["@type"] === "Article" || schema["@type"] === "BlogPosting") {
      if (schema["datePublished"] && !publishedDate) publishedDate = schema["datePublished"];
      if (schema["dateModified"] && !modifiedDate) modifiedDate = schema["dateModified"];
    }
    // Check for product-specific dates
    if (schema["@type"] === "Product" || schema["offers"]) {
      const offers = schema["offers"] || {};
      if (offers["priceValidUntil"] && !modifiedDate) {
        modifiedDate = offers["priceValidUntil"];
      }
      if (schema["releaseDate"] && !publishedDate) {
        publishedDate = schema["releaseDate"];
      }
    }
  });

  // Check for last-modified in sitemap data (would need to be passed from crawler)
  // For now, we'll also look for common date patterns in content
  // Note: Cheerio doesn't support :contains() pseudo-selector well, so we search in body text
  const bodyText = $("body").text();
  const dateMatch = bodyText.match(/(Updated|Last updated|Modified)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})/i);
  if (dateMatch && !modifiedDate) {
    const parsedDate = new Date(dateMatch[2]);
    if (!isNaN(parsedDate.getTime())) {
      modifiedDate = parsedDate.toISOString();
    }
  }

  const dateToCheck = modifiedDate || publishedDate;
  let daysSinceUpdate: number | null = null;
  let freshnessScore = 50;
  let status: "fresh" | "stale" | "unknown" = "unknown";

  if (dateToCheck) {
    try {
      const updateDate = new Date(dateToCheck);
      const now = new Date();
      daysSinceUpdate = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));

      // Industry-standard thresholds for e-commerce:
      // - Articles/News: 30-90 days is "fresh"
      // - Product pages: 6-12 months is acceptable (evergreen content)
      // - We use 90 days as "fresh" cutoff for LLM recency signals
      if (daysSinceUpdate <= 90) {
        freshnessScore = 100;
        status = "fresh";
      } else if (daysSinceUpdate <= 365) {
        freshnessScore = 75;
        status = "fresh"; // Still considered fresh for e-commerce
      } else if (daysSinceUpdate <= 730) {
        freshnessScore = 50;
        status = "stale";
      } else {
        freshnessScore = 25;
        status = "stale";
      }
    } catch {
      status = "unknown";
    }
  }

  return {
    publishedDate,
    modifiedDate,
    daysSinceUpdate,
    freshnessScore,
    status,
  };
}

function detectAuthor($: cheerio.CheerioAPI, jsonLdScripts: unknown[]): PageAnalysis["author"] {
  let authorName: string | null = null;
  let authorType: string | null = null;
  let hasCredentials = false;
  let hasBio = false;

  const authorMeta = $('meta[name="author"]').attr("content");
  if (authorMeta) {
    authorName = authorMeta.trim();
    if (authorName.toLowerCase().startsWith("multiple authors")) {
      authorName = "Multiple authors";
    }
  }

  if (authorName && authorName.length > 6) {
    hasCredentials = true;
  }

  const relAuthor = $('a[rel="author"]');
  if (relAuthor.length > 0) {
    authorName = relAuthor.text().trim();
    const href = relAuthor.attr("href") || "";
    if (href.includes("/author/")) {
      authorType = "website";
    }
  }

  jsonLdScripts.forEach((schema: any) => {
    if (schema["@type"] === "Person") {
      authorName = schema["name"] || "Unknown";
      authorType = "Person";
      hasCredentials = !!schema["jobTitle"] || !!schema["credentials"];
      hasBio = !!schema["description"];
    }
    if (schema["author"]) {
      const author = schema["author"];
      if (typeof author === "string") {
        authorName = author;
      } else if (typeof author === "object") {
        authorName = author["name"] || "Unknown";
        authorType = author["@type"] || "Unknown";
        hasCredentials = !!author["jobTitle"] || !!author["credentials"];
        hasBio = !!author["description"];
      }
    }
  });

  const hasAuthor = !!authorName;

  return {
    hasAuthor,
    authorName,
    authorType,
    hasCredentials,
    hasBio,
  };
}

function extractQuoteReadySnippets(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => {
      const wordCount = s.split(/\s+/).length;
      const hasSubject = /^(we|our|the|this|these|those|it|they|you|your|their|my|a|an)/i.test(s.toLowerCase());
      const isFactual = /\b(is|are|was|were|have|has|had|offer|provide|feature|include|support|enable|help|allow|ensure|guarantee|deliver|create|build|make)\b/i.test(s);
      const hasNumbers = /\d+/.test(s);
      const isSelfContained = !/\b(he|she|they|it)\s+(said|says|stated|mentioned|noted)/i.test(s.toLowerCase());
      
      return (
        wordCount >= 10 &&
        wordCount <= 35 &&
        (hasSubject || isFactual) &&
        !isSelfContained &&
        s.length > 50
      );
    })
    .slice(0, 5);

  return sentences;
}

function generateLLMDiscoveryPrompts(pages: PageAnalysis[], domain: string): SiteAnalysis["llmDiscoveryPrompts"] {
  const brandName = domain.split(".")[0]?.replace(/-/g, " ") || "this store";
  const mainPage = pages[0];
  
  const categories: SiteAnalysis["llmDiscoveryPrompts"] = [];
  
  categories.push({
    category: "Brand Discovery",
    prompts: [
      `What is ${brandName}?`,
      `Tell me about ${brandName} online store`,
      `Is ${brandName} a legitimate website?`,
      `${brandName} reviews and ratings`,
    ],
    likelihood: mainPage && mainPage.schemas.hasOrganizationSchema ? "high" : "medium",
  });

  if (pages.some(p => p.schemas.hasProductSchema)) {
    categories.push({
      category: "Product Discovery",
      prompts: [
        `Best products on ${brandName}`,
        `What does ${brandName} sell?`,
        `${brandName} product categories`,
        `Popular items on ${brandName}`,
      ],
      likelihood: "high",
    });
  }

  categories.push({
    category: "Comparison Shopping",
    prompts: [
      `${brandName} vs competitors`,
      `Is ${brandName} cheaper than Amazon?`,
      `Best place to buy [product] - does ${brandName} have it?`,
      `${brandName} alternatives`,
    ],
    likelihood: "medium",
  });

  categories.push({
    category: "Trust & Credibility",
    prompts: [
      `Is ${brandName} trustworthy?`,
      `${brandName} customer service reviews`,
      `Has anyone bought from ${brandName}?`,
      `${brandName} scam or legit`,
    ],
    likelihood: pages.some(p => p.schemas.hasOrganizationSchema) ? "high" : "medium",
  });

  const avgWordCount = pages.reduce((sum, p) => sum + p.wordCount, 0) / (pages.length || 1);
  if (avgWordCount > 500) {
    categories.push({
      category: "Informational Queries",
      prompts: [
        `How to use products from ${brandName}`,
        `${brandName} buying guide`,
        `What should I know before buying from ${brandName}`,
      ],
      likelihood: "medium",
    });
  }

  return categories;
}

function aggregateResults(
  pages: PageAnalysis[],
  domain: string,
  robotsTxt: string | null,
  sitemapXml: string | null,
  llmsTxt: string | null,
  sitemapUrls: string[] = []
): SiteAnalysis {
  const totalPages = pages.length;

  const productPages = pages.filter(p => p.schemas.hasProductSchema).length;
  const organizationPages = pages.filter(p => p.schemas.hasOrganizationSchema).length;
  const faqPages = pages.filter(p => p.schemas.hasFAQSchema).length;
  const breadcrumbPages = pages.filter(p => p.schemas.hasBreadcrumbSchema).length;
  const reviewPages = pages.filter(p => p.reviews.hasReviews).length;
  const aggregateRatingPages = pages.filter(p => p.schemas.hasAggregateRating).length;
  const offerPages = pages.filter(p => p.schemas.hasOfferSchema).length;
  const pagesWithSchema = pages.filter(p => p.jsonLdScripts.length > 0).length;
  const pagesWithoutSchema = totalPages - pagesWithSchema;

  // Page type breakdown
  const pageTypeBreakdown = {
    product: pages.filter(p => p.pageType === "product").length,
    collection: pages.filter(p => p.pageType === "collection").length,
    blog: pages.filter(p => p.pageType === "blog").length,
    homepage: pages.filter(p => p.pageType === "homepage").length,
    other: pages.filter(p => p.pageType === "other" || !p.pageType).length,
  };

  const schemaCoverage = {
    productPages,
    organizationPages,
    faqPages,
    breadcrumbPages,
    reviewPages,
    aggregateRatingPages,
    offerPages,
    pagesWithSchema,
    pagesWithoutSchema,
    pagesWithGTIN: pages.filter(p => {
      const ids = extractIdentifiers(p.jsonLdScripts);
      return !!ids.gtin;
    }).length,
    pagesWithMPN: pages.filter(p => {
      const ids = extractIdentifiers(p.jsonLdScripts);
      return !!ids.mpn;
    }).length,
    pagesWithSKU: pages.filter(p => p.schemas.hasProductSchema || p.schemas.hasOfferSchema).length,
  };

  const pagesWithMetaDesc = pages.filter(p => p.metaDescription.length >= 120).length;
  const pagesWithProperH1 = pages.filter(p => p.headings.h1 === 1).length;
  const pagesWithOG = pages.filter(p => Object.keys(p.openGraph).length >= 4).length;
  const pagesWithAltText = pages.filter(p => p.images.total === 0 || p.images.withoutAlt === 0).length;

  const aggregateFactors = [
    {
      name: "Schema Coverage",
      score: totalPages > 0 ? Math.round((pagesWithSchema / totalPages) * 100) : 0,
      status: (pagesWithSchema / totalPages) >= 0.8 ? "good" as const : 
        (pagesWithSchema / totalPages) >= 0.5 ? "warning" as const : "poor" as const,
      details: `${pagesWithSchema}/${totalPages} pages have structured data`,
    },
    {
      name: "Product Schema",
      score: totalPages > 0 ? Math.round((productPages / totalPages) * 100) : 0,
      status: productPages > 0 ? "good" as const : "poor" as const,
      details: `Product schema on ${productPages} pages`,
    },
    {
      name: "Review/Rating Schema",
      score: totalPages > 0 ? Math.round((reviewPages / totalPages) * 100) : 0,
      status: reviewPages > 0 ? "good" as const : "warning" as const,
      details: `Review/rating schema on ${reviewPages} pages`,
    },
    {
      name: "Meta Descriptions",
      score: totalPages > 0 ? Math.round((pagesWithMetaDesc / totalPages) * 100) : 0,
      status: (pagesWithMetaDesc / totalPages) >= 0.8 ? "good" as const : 
        (pagesWithMetaDesc / totalPages) >= 0.5 ? "warning" as const : "poor" as const,
      details: `${pagesWithMetaDesc}/${totalPages} pages have good meta descriptions`,
    },
    {
      name: "Open Graph Tags",
      score: totalPages > 0 ? Math.round((pagesWithOG / totalPages) * 100) : 0,
      status: (pagesWithOG / totalPages) >= 0.8 ? "good" as const : 
        (pagesWithOG / totalPages) >= 0.5 ? "warning" as const : "poor" as const,
      details: `${pagesWithOG}/${totalPages} pages have OG tags`,
    },
    {
      name: "Heading Structure",
      score: totalPages > 0 ? Math.round((pagesWithProperH1 / totalPages) * 100) : 0,
      status: (pagesWithProperH1 / totalPages) >= 0.8 ? "good" as const : 
        (pagesWithProperH1 / totalPages) >= 0.5 ? "warning" as const : "poor" as const,
      details: `${pagesWithProperH1}/${totalPages} pages have proper H1`,
    },
    {
      name: "Image Alt Text",
      score: totalPages > 0 ? Math.round((pagesWithAltText / totalPages) * 100) : 0,
      status: (pagesWithAltText / totalPages) >= 0.8 ? "good" as const : 
        (pagesWithAltText / totalPages) >= 0.5 ? "warning" as const : "poor" as const,
      details: `${pagesWithAltText}/${totalPages} pages have all images with alt`,
    },
    {
      name: "robots.txt",
      score: robotsTxt ? 100 : 0,
      status: robotsTxt ? "good" as const : "poor" as const,
      details: robotsTxt ? "robots.txt found" : "No robots.txt",
    },
    {
      name: "Sitemap",
      score: sitemapXml ? 100 : 0,
      status: sitemapXml ? "good" as const : "warning" as const,
      details: sitemapUrls.length > 0 
        ? `Found ${sitemapUrls.length} sitemap(s)` 
        : "No sitemap found",
    },
    {
      name: "llms.txt",
      score: llmsTxt ? 100 : 0,
      status: llmsTxt ? "good" as const : "warning" as const,
      details: llmsTxt ? "llms.txt found - optimized for LLMs" : "No llms.txt (recommended for AI visibility)",
    },
  ];

  const aggregateRecommendations: SiteAnalysis["aggregateRecommendations"] = [];

  if (!llmsTxt) {
    aggregateRecommendations.push({
      title: "Add llms.txt File",
      description: "Create an llms.txt file at your site root to provide structured information specifically for LLMs. This is becoming the standard for AI discoverability.",
      priority: "high",
      affectedPages: 0,
    });
  }

  if (pagesWithoutSchema > 0) {
    aggregateRecommendations.push({
      title: "Add Structured Data to More Pages",
      description: `${pagesWithoutSchema} pages are missing JSON-LD structured data. Add schema.org markup to improve discoverability.`,
      priority: "high",
      affectedPages: pagesWithoutSchema,
    });
  }

  if (productPages === 0) {
    aggregateRecommendations.push({
      title: "Add Product Schema",
      description: "No product pages found with Product schema. This is critical for e-commerce LLM visibility.",
      priority: "high",
      affectedPages: totalPages,
    });
  }

  if (organizationPages === 0) {
    aggregateRecommendations.push({
      title: "Add Organization Schema",
      description: "Add Organization or LocalBusiness schema to at least your homepage to establish brand identity.",
      priority: "medium",
      affectedPages: 1,
    });
  }

  if (pagesWithMetaDesc < totalPages) {
    aggregateRecommendations.push({
      title: "Improve Meta Descriptions",
      description: `${totalPages - pagesWithMetaDesc} pages need better meta descriptions (120-160 characters).`,
      priority: "high",
      affectedPages: totalPages - pagesWithMetaDesc,
    });
  }

  if (pagesWithProperH1 < totalPages) {
    aggregateRecommendations.push({
      title: "Fix Heading Structure",
      description: `${totalPages - pagesWithProperH1} pages have missing or multiple H1 tags.`,
      priority: "medium",
      affectedPages: totalPages - pagesWithProperH1,
    });
  }

  if (faqPages === 0) {
    aggregateRecommendations.push({
      title: "Add FAQ Schema",
      description: "No FAQ schema found. Add FAQ sections with schema markup to appear in AI-generated answers.",
      priority: "medium",
      affectedPages: 0,
    });
  }

  if (pagesWithOG < totalPages) {
    aggregateRecommendations.push({
      title: "Add Open Graph Tags",
      description: `${totalPages - pagesWithOG} pages are missing complete OG tags.`,
      priority: "low",
      affectedPages: totalPages - pagesWithOG,
    });
  }

  const llmDiscoveryPrompts = generateLLMDiscoveryPrompts(pages, domain);
  
  // Calculate AI crawler access
  const aiCrawlerAccess = checkAICrawlerAccess(robotsTxt);
  
  // Extract brands from pages
  const brands = new Set<string>();
  pages.forEach(p => {
    if (p.h1Texts && p.h1Texts.length > 0) {
      p.h1Texts.forEach(h1 => brands.add(h1));
    }
    if (p.title) brands.add(p.title.split("|")[0].split("-")[0].trim());
  });
  const brandVariations = Array.from(brands).filter(b => b.length > 2).slice(0, 5);
  
  // Extract categories from pages
  const categories = new Set<string>();
  pages.forEach(p => {
    if (p.breadcrumbs && p.breadcrumbs.length > 0) {
      p.breadcrumbs.forEach(b => categories.add(b));
    }
  });
  const categoriesList = Array.from(categories);
  
  // Get organization schema info
  const orgPage = pages.find(p => p.schemas.hasOrganizationSchema) || pages.find(p => p.pageType === "homepage") || pages[0];
  const organizationSchemaInfo = {
    present: orgPage?.schemas.hasOrganizationSchema || false,
    hasName: !!orgPage?.title,
    hasLogo: !!orgPage?.openGraph?.image,
    hasSameAs: false,
    hasDescription: !!orgPage?.metaDescription,
  };
  
  // Calculate Site Discoverability Score
  const siteDiscoverability = calculateSiteDiscoverabilityScore({
    robotsTxt,
    aiCrawlerAccess,
    llmsTxt,
    hasSitemap: !!sitemapXml,
    sitemapProductCount: sitemapUrls.length,
    organizationSchema: organizationSchemaInfo,
    categories: categoriesList,
    brandVariations,
    isHttps: pages[0]?.url?.startsWith("https") || false,
  });
  
  // Calculate Product Extractability Score (average of product pages)
  const productPageList = pages.filter(p => p.pageType === "product");
  let productExtractabilityScore = 0;
  let productExtractabilityBreakdown = undefined;
  
  if (productPageList.length > 0) {
    const scores = productPageList.map(p => {
      const result = calculateProductExtractabilityScore(p);
      return result;
    });
    productExtractabilityScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
    productExtractabilityBreakdown = scores[0]?.breakdown;
  } else {
    // Use first page as fallback
    const firstPageScore = calculateProductExtractabilityScore(pages[0]);
    productExtractabilityScore = firstPageScore.score;
    productExtractabilityBreakdown = firstPageScore.breakdown;
  }
  
  // Legacy aggregate score (average of two scores)
  const aggregateScore = Math.round((siteDiscoverability.score + productExtractabilityScore) / 2);

  const siteData = {
    mainUrl: pages[0]?.url || "",
    domain,
    robotsTxt,
    sitemap: sitemapXml,
    sitemapUrls,
    llmsTxt,
    hasRobotsTxt: !!robotsTxt,
    hasSitemap: !!sitemapXml,
    hasLlmsTxt: !!llmsTxt,
    pagesAnalyzed: totalPages,
    totalPages,
    pages,
    schemaCoverage,
    pageTypeBreakdown,
  };

  const generatedLlmsTxt = generateLlmsTxt(siteData as any);
  
  const organizationSchema = generateOrganizationSchema(siteData as any);
  
  const homepageSchemas = pages[0] ? generateSchemaForPage(pages[0]) : [];
  
  const productSchemas = pages
    .filter(p => p.schemas.hasProductSchema || p.url.includes("/product"))
    .slice(0, 5)
    .flatMap(p => generateSchemaForPage(p));

  // Get comparison contexts
  const siteComparison = getComparisonContext(siteDiscoverability.score);
  const productComparison = getComparisonContext(productExtractabilityScore);
  
  // Detect URL type
  const urlTypeAnalysis = detectUrlType(pages[0]?.url || "");
  const analyzedSingleProduct = urlTypeAnalysis.type === "product" && pages.length === 1;
  const showFullSiteOption = analyzedSingleProduct;

  return {
    ...siteData,
    siteDiscoverabilityScore: siteDiscoverability.score,
    siteDiscoverabilityBreakdown: siteDiscoverability.breakdown,
    productExtractabilityScore,
    productExtractabilityBreakdown,
    analyzedUrlType: urlTypeAnalysis.type,
    analyzedSingleProduct,
    showFullSiteOption,
    aggregateScore,
    aggregateScoreBreakdown: undefined,
    aggregateFactors,
    aggregateRecommendations,
    llmDiscoveryPrompts,
    generatedArtifacts: {
      llmsTxt: generatedLlmsTxt,
      homepageSchemas,
      productSchemas,
      organizationSchema,
    },
    limitations: {
      trainingDataInclusion: false,
      domainAuthority: false,
      brandRecognition: false,
      citationDensity: false,
      userBehavior: false,
      externalMentions: false,
      thirdPartyReviews: false,
    },
    comparisonContext: {
      siteDiscoverability: siteComparison,
      productExtractability: productComparison,
      comparedTo: "typical e-commerce sites",
    },
  };
}
