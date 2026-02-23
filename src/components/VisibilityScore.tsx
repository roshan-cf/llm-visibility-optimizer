"use client";

import { useState } from "react";
import { AnalysisResult, SiteDiscoverabilityBreakdown, ExtractabilityBreakdown } from "@/lib/types";
import { ActionCard } from "./ActionCard";

interface VisibilityScoreProps {
  result: AnalysisResult;
}

function TwoLayerScoreCard({
  title,
  subtitle,
  score,
  breakdown,
  isProductPage,
}: {
  title: string;
  subtitle: string;
  score: number;
  breakdown?: SiteDiscoverabilityBreakdown | ExtractabilityBreakdown | null;
  isProductPage?: boolean;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "from-emerald-500 to-teal-500";
    if (s >= 60) return "from-blue-500 to-indigo-500";
    if (s >= 40) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return { text: "Excellent", badge: "badge-success" };
    if (s >= 60) return { text: "Good", badge: "badge-info" };
    if (s >= 40) return { text: "Fair", badge: "badge-warning" };
    return { text: "Needs Work", badge: "badge-error" };
  };

  const scoreInfo = getScoreLabel(score);

  return (
    <div className="card-modern p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        {isProductPage && (
          <span className="badge badge-info text-xs">Single Product</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
          {score}
        </div>
        <div className="flex-1">
          <span className={`badge ${scoreInfo.badge}`}>{scoreInfo.text}</span>
          {breakdown && "externalMentions" in breakdown && (
            <p className="text-xs text-zinc-500 mt-2">
              External mentions & domain authority affect discoverability but can't be measured
            </p>
          )}
          {breakdown && "thirdPartyReviews" in breakdown && (
            <p className="text-xs text-zinc-500 mt-2">
              Third-party reviews (Reddit, forums) impact recommendations but can't be measured
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VisibilityScore({ result }: VisibilityScoreProps) {
  const avgFreshnessScore = result.pages.length > 0
    ? Math.round(result.pages.reduce((sum, p) => sum + (p.freshness?.freshnessScore || 50), 0) / result.pages.length)
    : 50;

  const pagesWithAuthors = result.pages.filter(p => p.author?.hasAuthor).length;
  const pagesWithFreshContent = result.pages.filter(p => p.freshness?.status === "fresh").length;
  const totalSnippets = result.pages.reduce((sum, p) => sum + (p.quoteReadySnippets?.length || 0), 0);

  // Check if URL was redirected
  const resolvedUrl = (result as any).resolvedUrl;

  return (
    <div className="space-y-6">
      {/* URL Redirect Notice */}
      {resolvedUrl && (
        <div className="card-modern p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Short URL Resolved
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">Original URL</span>
              <div className="text-blue-700 dark:text-blue-300 text-xs truncate mt-1 font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                {resolvedUrl.original}
              </div>
              <span className="text-blue-500 dark:text-blue-500 text-xs">Domain: {resolvedUrl.originalDomain}</span>
            </div>
            <div>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Final URL</span>
              <div className="text-emerald-700 dark:text-emerald-300 text-xs truncate mt-1 font-mono bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                {resolvedUrl.final}
              </div>
              <span className="text-emerald-500 dark:text-emerald-500 text-xs">Domain: {resolvedUrl.finalDomain}</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            Short URLs are automatically resolved to their final destination for accurate analysis.
          </p>
        </div>
      )}

      {/* Two-Layer Score Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <TwoLayerScoreCard
          title="Site Discoverability"
          subtitle="Can LLMs find your brand?"
          score={result.siteDiscoverabilityScore}
          breakdown={result.siteDiscoverabilityBreakdown}
        />
        <TwoLayerScoreCard
          title="Product Extractability"
          subtitle="Can LLMs understand your product?"
          score={result.productExtractabilityScore}
          breakdown={result.productExtractabilityBreakdown}
          isProductPage={result.analyzedSingleProduct}
        />
      </div>

      {/* Analyze Full Site Button */}
      {result.showFullSiteOption && (
        <div className="card-modern p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-indigo-800 dark:text-indigo-200">Analyzed a single product page</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                Get a complete Site Discoverability score by analyzing your full site
              </p>
            </div>
            <button className="btn-primary whitespace-nowrap">
              Analyze Full Site
            </button>
          </div>
        </div>
      )}

      {/* Site Discoverability Breakdown */}
      {result.siteDiscoverabilityBreakdown && (
        <div className="card-modern p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            Site Discoverability Breakdown
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <BreakdownItem
              label="llms.txt"
              status={result.siteDiscoverabilityBreakdown.llmsTxt.present ? "good" : "poor"}
              detail={result.siteDiscoverabilityBreakdown.llmsTxt.present ? "Present" : "Missing"}
              points={result.siteDiscoverabilityBreakdown.llmsTxt.points}
              max={result.siteDiscoverabilityBreakdown.llmsTxt.max}
            />
            <BreakdownItem
              label="AI Crawler Access"
              status={result.siteDiscoverabilityBreakdown.aiCrawlerAccess.allowsOAI ? "good" : "warning"}
              detail={result.siteDiscoverabilityBreakdown.aiCrawlerAccess.details}
              points={result.siteDiscoverabilityBreakdown.aiCrawlerAccess.points}
              max={result.siteDiscoverabilityBreakdown.aiCrawlerAccess.max}
            />
            <BreakdownItem
              label="Sitemap"
              status={result.siteDiscoverabilityBreakdown.sitemap.present ? "good" : "poor"}
              detail={result.siteDiscoverabilityBreakdown.sitemap.present ? `${result.siteDiscoverabilityBreakdown.sitemap.urlCount} URLs` : "Missing"}
              points={result.siteDiscoverabilityBreakdown.sitemap.points}
              max={result.siteDiscoverabilityBreakdown.sitemap.max}
            />
            <BreakdownItem
              label="Organization Schema"
              status={result.siteDiscoverabilityBreakdown.organizationSchema.present ? "good" : "warning"}
              detail={result.siteDiscoverabilityBreakdown.organizationSchema.present ? "Present" : "Missing"}
              points={result.siteDiscoverabilityBreakdown.organizationSchema.points}
              max={result.siteDiscoverabilityBreakdown.organizationSchema.max}
            />
          </div>
          
          {/* Action Cards for Issues */}
          <div className="mt-4 space-y-3">
            {!result.siteDiscoverabilityBreakdown.llmsTxt.present && result.generatedArtifacts?.llmsTxt && (
              <ActionCard
                title="Missing llms.txt"
                severity="critical"
                description="Add an llms.txt file to help LLMs understand your site. This is becoming the standard for AI discoverability."
                actions={[
                  { label: "Download llms.txt", type: "download", content: result.generatedArtifacts.llmsTxt.content },
                  { label: "Learn more", type: "link", url: "https://llmstxt.org" }
                ]}
              />
            )}
            {!result.siteDiscoverabilityBreakdown.aiCrawlerAccess.allowsOAI && (
              <ActionCard
                title="AI Crawlers May Be Blocked"
                severity="warning"
                description="Your robots.txt may be blocking ChatGPT's shopping bot. Add an exception for OAI-SearchBot."
                actions={[
                  { label: "Copy robots.txt entry", type: "copy", content: "User-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /" },
                  { label: "View your robots.txt", type: "link", url: `https://${result.domain}/robots.txt` }
                ]}
              />
            )}
            {!result.siteDiscoverabilityBreakdown.sitemap.present && (
              <ActionCard
                title="Missing Sitemap"
                severity="warning"
                description="Add a sitemap.xml to help search engines and LLMs discover your pages."
                actions={[
                  { label: "Learn about sitemaps", type: "link", url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview" }
                ]}
              />
            )}
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Can't Measure:</strong> External mentions, domain authority, and brand recognition significantly impact discoverability but require external data sources.
            </p>
          </div>
        </div>
      )}

      {/* Product Extractability Breakdown */}
      {result.productExtractabilityBreakdown && (
        <div className="card-modern p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            Product Extractability Breakdown
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <BreakdownItem
              label="Identity"
              status={result.productExtractabilityBreakdown.identity.totalPoints >= 15 ? "good" : result.productExtractabilityBreakdown.identity.totalPoints >= 10 ? "warning" : "poor"}
              detail={result.productExtractabilityBreakdown.identity.productName.found ? `Name found via ${result.productExtractabilityBreakdown.identity.productName.source}` : "Missing product name"}
              points={result.productExtractabilityBreakdown.identity.totalPoints}
              max={result.productExtractabilityBreakdown.identity.maxPoints}
            />
            <BreakdownItem
              label="Pricing"
              status={result.productExtractabilityBreakdown.pricing.totalPoints >= 12 ? "good" : result.productExtractabilityBreakdown.pricing.totalPoints >= 6 ? "warning" : "poor"}
              detail={result.productExtractabilityBreakdown.pricing.price.found ? `${result.productExtractabilityBreakdown.pricing.price.source}` : "Not detected"}
              points={result.productExtractabilityBreakdown.pricing.totalPoints}
              max={result.productExtractabilityBreakdown.pricing.maxPoints}
            />
            <BreakdownItem
              label="Availability"
              status={result.productExtractabilityBreakdown.availability.found ? "good" : "poor"}
              detail={result.productExtractabilityBreakdown.availability.found ? result.productExtractabilityBreakdown.availability.status : "Unknown"}
              points={result.productExtractabilityBreakdown.availability.points}
              max={result.productExtractabilityBreakdown.availability.max}
            />
            <BreakdownItem
              label="Reviews"
              status={result.productExtractabilityBreakdown.reviews.totalPoints >= 15 ? "good" : result.productExtractabilityBreakdown.reviews.totalPoints >= 8 ? "warning" : "poor"}
              detail={result.productExtractabilityBreakdown.reviews.rating.found ? `${result.productExtractabilityBreakdown.reviews.rating.value}/5 (${result.productExtractabilityBreakdown.reviews.count.value} reviews)` : "No ratings found"}
              points={result.productExtractabilityBreakdown.reviews.totalPoints}
              max={result.productExtractabilityBreakdown.reviews.maxPoints}
            />
            <BreakdownItem
              label="Identifiers"
              status={result.productExtractabilityBreakdown.identifiers.count > 0 ? "good" : "poor"}
              detail={result.productExtractabilityBreakdown.identifiers.count > 0 ? `${result.productExtractabilityBreakdown.identifiers.count} found (GTIN/MPN/SKU)` : "Missing GTIN/MPN/SKU"}
              points={result.productExtractabilityBreakdown.identifiers.points}
              max={result.productExtractabilityBreakdown.identifiers.max}
            />
            <BreakdownItem
              label="Images"
              status={result.productExtractabilityBreakdown.images.count >= 3 ? "good" : result.productExtractabilityBreakdown.images.count >= 1 ? "warning" : "poor"}
              detail={`${result.productExtractabilityBreakdown.images.count} images, ${result.productExtractabilityBreakdown.images.withAlt} with alt`}
              points={result.productExtractabilityBreakdown.images.points}
              max={result.productExtractabilityBreakdown.images.max}
            />
            <BreakdownItem
              label="Specifications"
              status={result.productExtractabilityBreakdown.specifications.found ? "good" : "poor"}
              detail={result.productExtractabilityBreakdown.specifications.found ? `${result.productExtractabilityBreakdown.specifications.count} specs` : "Not found"}
              points={result.productExtractabilityBreakdown.specifications.points}
              max={result.productExtractabilityBreakdown.specifications.max}
            />
            <BreakdownItem
              label="Schema Bonus"
              status={result.productExtractabilityBreakdown.schemaBonus.points >= 8 ? "good" : result.productExtractabilityBreakdown.schemaBonus.points >= 5 ? "warning" : "poor"}
              detail={result.productExtractabilityBreakdown.schemaBonus.isComplete ? "Complete schema" : result.productExtractabilityBreakdown.schemaBonus.hasProductSchema ? "Partial schema" : "No schema"}
              points={result.productExtractabilityBreakdown.schemaBonus.points}
              max={result.productExtractabilityBreakdown.schemaBonus.max}
            />
          </div>
          
          {/* Action Cards for Product Issues */}
          <div className="mt-4 space-y-3">
            {!result.productExtractabilityBreakdown.schemaBonus.hasProductSchema && (
              <ActionCard
                title="Missing Product Schema"
                severity="critical"
                description="Add JSON-LD Product schema to help LLMs extract product information reliably."
                actions={[
                  { label: "Copy schema template", type: "copy", content: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Your Product Name",
  "description": "Product description",
  "image": "https://example.com/product-image.jpg",
  "offers": {
    "@type": "Offer",
    "price": "99.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "100"
  }
}` },
                  { label: "Validate with Google", type: "link", url: "https://search.google.com/test/rich-results" }
                ]}
              />
            )}
            {result.productExtractabilityBreakdown.identifiers.count === 0 && (
              <ActionCard
                title="Missing Product Identifiers"
                severity="warning"
                description="GTIN, MPN, or SKU help LLMs match your product across platforms."
                actions={[
                  { label: "Learn about GTINs", type: "link", url: "https://www.gs1.org/standards/id-keys/gtin" }
                ]}
              />
            )}
            {!result.productExtractabilityBreakdown.reviews.rating.found && (
              <ActionCard
                title="No Ratings Detected"
                severity="warning"
                description="Add AggregateRating schema to show LLMs that customers trust your product."
                actions={[
                  { label: "Copy rating schema", type: "copy", content: `"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.5",
  "reviewCount": "42"
}` }
                ]}
              />
            )}
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Can't Measure:</strong> Third-party reviews on Reddit, forums, and external sites significantly impact LLM recommendations but require external data sources.
            </p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          Recommendations
        </h3>
        <div className="space-y-3">
          {result.aggregateRecommendations.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </div>
      </div>

      {/* Pages List - Collapsible */}
      <CollapsiblePagesList pages={result.pages} />

      {/* Generated Artifacts */}
      {result.generatedArtifacts?.llmsTxt && (
        <div className="card-modern p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </span>
            Generated Artifacts
          </h3>
          
          <GeneratedLlmsTxtSection llmsTxt={result.generatedArtifacts.llmsTxt} />
          
          {result.generatedArtifacts.organizationSchema && (
            <GeneratedSchemaSection 
              schema={result.generatedArtifacts.organizationSchema} 
              title="Organization Schema" 
            />
          )}
          
          {result.generatedArtifacts.homepageSchemas && result.generatedArtifacts.homepageSchemas.length > 0 && (
            <GeneratedSchemaSection 
              schema={result.generatedArtifacts.homepageSchemas[0]} 
              title="Homepage Schema" 
            />
          )}
        </div>
      )}
    </div>
  );
}

function BreakdownItem({ 
  label, 
  status, 
  detail, 
  points, 
  max 
}: { 
  label: string; 
  status: "good" | "warning" | "poor"; 
  detail: string; 
  points: number; 
  max: number;
}) {
  const statusColors: Record<string, string> = {
    good: "from-emerald-500 to-teal-500",
    warning: "from-amber-500 to-orange-500",
    poor: "from-red-500 to-rose-500",
  };
  const statusBadge: Record<string, string> = {
    good: "badge-success",
    warning: "badge-warning",
    poor: "badge-error",
  };

  const percentage = max > 0 ? (points / max) * 100 : 0;

  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{points}/{max}</span>
          <span className={`badge ${statusBadge[status]} text-xs`}>{status}</span>
        </div>
      </div>
      <div className="progress-bar mb-2">
        <div className={`progress-bar-fill bg-gradient-to-r ${statusColors[status]}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: { title: string; description: string; priority: string; affectedPages?: number } }) {
  const priorityConfig: Record<string, { bg: string; border: string; icon: string }> = {
    high: { bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-200 dark:border-red-800/50", icon: "🔴" },
    medium: { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800/50", icon: "🟡" },
    low: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800/50", icon: "🟢" },
  };
  const config = priorityConfig[recommendation.priority] || priorityConfig.low;

  return (
    <div className={`flex gap-3 p-4 rounded-xl ${config.bg} border ${config.border}`}>
      <span className="text-lg">{config.icon}</span>
      <div className="flex-1">
        <h4 className="font-medium text-sm">{recommendation.title}</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{recommendation.description}</p>
        {recommendation.affectedPages && recommendation.affectedPages > 0 && (
          <p className="text-xs text-zinc-400 mt-2">{recommendation.affectedPages} page(s) affected</p>
        )}
      </div>
    </div>
  );
}

function PageCard({ page }: { page: { 
  url: string; 
  title?: string; 
  score: number; 
  pageType?: string;
  scoreBreakdown?: {
    pageContext?: {
      detectedType?: string;
      isApplicable?: boolean;
      reason?: string | null;
    };
    extractability?: {
      score?: number;
      label?: string;
    };
  };
  schemas: { hasProductSchema: boolean }; 
  reviews?: { hasReviews: boolean }; 
  author?: { hasAuthor: boolean }; 
  freshness?: { status: string } 
} }) {
  const pageType = page.pageType || page.scoreBreakdown?.pageContext?.detectedType || "unknown";
  const isApplicable = page.scoreBreakdown?.pageContext?.isApplicable ?? true;
  const reason = page.scoreBreakdown?.pageContext?.reason;
  const extractabilityLabel = page.scoreBreakdown?.extractability?.label || "";
  
  const pageTypeColors: Record<string, string> = {
    product: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    collection: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    blog: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    homepage: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    other: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pageTypeColors[pageType] || pageTypeColors.other}`}>
              {pageType}
            </span>
            {extractabilityLabel && isApplicable && (
              <span className="text-xs text-zinc-400">{extractabilityLabel}</span>
            )}
          </div>
          <div className="text-sm font-medium truncate text-indigo-600 dark:text-indigo-400" title={page.url}>
            {page.url.replace(/^https?:\/\//, "")}
          </div>
          <div className="text-xs text-zinc-500 truncate">{page.title || "No title"}</div>
          {reason && (
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">{reason}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isApplicable ? (
            <>
              <span className="text-sm font-bold">{page.score}</span>
              {page.schemas.hasProductSchema && <span className="badge badge-success text-xs">Product</span>}
              {page.reviews?.hasReviews && <span className="badge badge-info text-xs">Reviews</span>}
            </>
          ) : (
            <span className="text-xs text-zinc-400 italic">N/A</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CollapsiblePagesList({ pages }: { pages: Array<{
  url: string;
  title?: string;
  score: number;
  pageType?: string;
  scoreBreakdown?: {
    pageContext?: {
      detectedType?: string;
      isApplicable?: boolean;
      reason?: string | null;
    };
    extractability?: {
      score?: number;
      label?: string;
    };
  };
  schemas: { hasProductSchema: boolean }; 
  reviews?: { hasReviews: boolean }; 
  author?: { hasAuthor: boolean }; 
  freshness?: { status: string } 
}> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card-modern p-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          Pages Analyzed ({pages.length})
        </h3>
        <span className="text-sm text-zinc-500">
          {expanded ? "Click to collapse" : "Click to expand"}
        </span>
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
          {pages.map((page, index) => (
            <PageCard key={index} page={page} />
          ))}
        </div>
      )}
    </div>
  );
}

function GeneratedLlmsTxtSection({ llmsTxt }: { llmsTxt: { content: string; warnings: string[]; confidence: string } }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(llmsTxt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceBadge = llmsTxt.confidence === "high" ? "badge-success" : 
                          llmsTxt.confidence === "medium" ? "badge-warning" : "badge-error";

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">llms.txt</span>
          <span className={`badge ${confidenceBadge}`}>{llmsTxt.confidence} confidence</span>
        </div>
        <button onClick={handleCopy} className="btn-secondary text-xs py-1 px-3">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {llmsTxt.warnings.length > 0 && (
        <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          {llmsTxt.warnings.map((w, i) => <div key={i}>• {w}</div>)}
        </div>
      )}
      <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-xl text-xs overflow-x-auto max-h-64 overflow-y-auto">
        {llmsTxt.content}
      </pre>
    </div>
  );
}

function GeneratedSchemaSection({ schema, title }: { schema: { type: string; jsonString: string; confidence: string; fieldsExtracted: string[]; fieldsMissing: string[]; suggestions: string[] }; title: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(schema.jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceBadge = schema.confidence === "high" ? "badge-success" : 
                          schema.confidence === "medium" ? "badge-warning" : "badge-error";

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          <span className={`badge ${confidenceBadge}`}>{schema.confidence}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setExpanded(!expanded)} className="btn-secondary text-xs py-1 px-3">
            {expanded ? "Hide" : "Show"}
          </button>
          <button onClick={handleCopy} className="btn-secondary text-xs py-1 px-3">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
            Extracted ({schema.fieldsExtracted.length})
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-500">
            {schema.fieldsExtracted.join(", ") || "None"}
          </div>
        </div>
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
            Missing ({schema.fieldsMissing.length})
          </div>
          <div className="text-xs text-red-600 dark:text-red-500">
            {schema.fieldsMissing.join(", ") || "None"}
          </div>
        </div>
      </div>
      
      {schema.suggestions.length > 0 && (
        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400">
          {schema.suggestions.map((s, i) => <div key={i}>• {s}</div>)}
        </div>
      )}
      
      {expanded && (
        <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-xl text-xs overflow-x-auto">
          {schema.jsonString}
        </pre>
      )}
    </div>
  );
}
