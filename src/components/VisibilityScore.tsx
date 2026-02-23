"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";

interface VisibilityScoreProps {
  result: AnalysisResult;
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-teal-500";
    if (score >= 60) return "from-blue-500 to-indigo-500";
    if (score >= 40) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: "Excellent", badge: "badge-success" };
    if (score >= 60) return { text: "Good", badge: "badge-info" };
    if (score >= 40) return { text: "Needs Work", badge: "badge-warning" };
    return { text: "Poor", badge: "badge-error" };
  };

  const scoreInfo = getScoreLabel(result.aggregateScore);

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
            ✓ Short URLs are automatically resolved to their final destination for accurate analysis.
          </p>
        </div>
      )}

      {/* Limitations Warning */}
      <div className="card-modern p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          What This Score Means (And Doesn't Mean)
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">What We Measure ✓</h4>
            <ul className="text-amber-600 dark:text-amber-400 space-y-1 text-xs">
              <li>• Can LLMs extract your product information?</li>
              <li>• Is your content structured for AI comprehension?</li>
              <li>• Are you following technical best practices?</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">What We CAN'T Measure ✗</h4>
            <ul className="text-amber-600 dark:text-amber-400 space-y-1 text-xs">
              <li>• Training data inclusion (is your site in ChatGPT's data?)</li>
              <li>• Domain authority (how many sites link to you?)</li>
              <li>• Brand recognition (do LLMs "know" your brand?)</li>
              <li>• Citation density (how often cited across the web?)</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 italic">
          Sites like Amazon may score low on technical factors but rank high in LLM results due to factors we cannot measure.
        </p>
      </div>

      {/* Main Score Card */}
      <div className="card-modern p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className={`text-8xl font-bold bg-gradient-to-r ${getScoreColor(result.aggregateScore)} bg-clip-text text-transparent`}>
            {result.aggregateScore}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
              <span className={`badge ${scoreInfo.badge}`}>{scoreInfo.text}</span>
              {result.comparisonContext && (
                <span className="badge badge-info">{result.comparisonContext.label}</span>
              )}
              <span className="text-zinc-500 text-sm">LLM Readiness Score</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Analyzed {result.pagesAnalyzed} pages from <span className="font-medium text-zinc-900 dark:text-white">{result.domain}</span>
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              {result.aggregateScore >= 70
                ? "Your site is well-optimized for AI visibility. Focus on maintaining coverage."
                : result.aggregateScore >= 50
                ? "Decent AI visibility with room for improvement. See recommendations below."
                : "Significant improvements needed. Start with structured data implementation."}
            </p>
          </div>
        </div>
      </div>

      {/* Schema Coverage */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </span>
          Schema Coverage
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard 
            value={result.schemaCoverage.pagesWithSchema} 
            label="With Schema" 
            color="emerald"
            total={result.pagesAnalyzed}
          />
          <StatCard 
            value={result.schemaCoverage.productPages} 
            label="Product" 
            color="blue"
          />
          <StatCard 
            value={result.schemaCoverage.reviewPages} 
            label="Reviews" 
            color="purple"
          />
          <StatCard 
            value={result.schemaCoverage.aggregateRatingPages} 
            label="Ratings" 
            color="amber"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatCard value={result.schemaCoverage.organizationPages} label="Organization" small />
          <StatCard value={result.schemaCoverage.faqPages} label="FAQ" small />
          <StatCard value={result.schemaCoverage.breadcrumbPages} label="Breadcrumb" small />
          <StatCard value={pagesWithAuthors} label="With Author" small />
        </div>
      </div>

      {/* LLM Readiness */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          LLM Readiness Metrics
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <MetricCard
            title="Content Freshness"
            score={avgFreshnessScore}
            detail={`${pagesWithFreshContent} pages with fresh content`}
          />
          <MetricCard
            title="Quote-Ready Snippets"
            score={Math.min(100, totalSnippets * 10)}
            detail={`${totalSnippets} citable sentences`}
          />
          <MetricCard
            title="Author Attribution"
            score={result.pages.length > 0 ? Math.round((pagesWithAuthors / result.pages.length) * 100) : 0}
            detail={`${pagesWithAuthors} pages with author`}
          />
        </div>
      </div>

      {/* Site-wide Factors */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </span>
          Site-wide Factors
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {result.aggregateFactors.map((factor, index) => (
            <FactorCard key={index} factor={factor} />
          ))}
        </div>
      </div>

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

      {/* Pages List */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Pages Analyzed ({result.pages.length})
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {result.pages.map((page, index) => (
            <PageCard key={index} page={page} />
          ))}
        </div>
      </div>

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

function StatCard({ value, label, color, total, small = false }: { value: number; label: string; color?: string; total?: number; small?: boolean }) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    amber: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="stat-card">
      <div className={`${small ? "text-xl" : "text-2xl"} font-bold ${color ? colorClasses[color] : ""}`}>
        {value}
      </div>
      <div className={`${small ? "text-xs" : "text-sm"} text-zinc-500 mt-1`}>{label}</div>
      {total !== undefined && (
        <div className="text-xs text-zinc-400">{Math.round((value / total) * 100)}%</div>
      )}
    </div>
  );
}

function MetricCard({ title, score, detail }: { title: string; score: number; detail: string }) {
  const getColor = (s: number) => {
    if (s >= 70) return "from-emerald-500 to-teal-500";
    if (s >= 50) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm">{title}</span>
        <span className={`badge ${score >= 70 ? "badge-success" : score >= 50 ? "badge-warning" : "badge-error"}`}>
          {score}%
        </span>
      </div>
      <div className="progress-bar mb-2">
        <div className={`progress-bar-fill bg-gradient-to-r ${getColor(score)}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function FactorCard({ factor }: { factor: { name: string; score: number; status: string; details: string } }) {
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

  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{factor.name}</span>
        <span className={`badge ${statusBadge[factor.status]}`}>{factor.status}</span>
      </div>
      <div className="progress-bar mb-2">
        <div className={`progress-bar-fill bg-gradient-to-r ${statusColors[factor.status]}`} style={{ width: `${factor.score}%` }} />
      </div>
      <p className="text-xs text-zinc-500">{factor.details}</p>
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
