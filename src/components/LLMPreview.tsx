"use client";

import { useMemo } from "react";
import { AnalysisResult } from "@/lib/types";

interface LLMPreviewProps {
  result: AnalysisResult;
}

export function LLMPreview({ result }: LLMPreviewProps) {
  const siteSummary = useMemo(() => {
    const pagesWithSchema = result.schemaCoverage.pagesWithSchema;
    const total = result.pagesAnalyzed;
    const avgWordCount = result.pages.reduce((sum, p) => sum + p.wordCount, 0) / (total || 1);

    return {
      domain: result.domain,
      pagesAnalyzed: total,
      schemaCoverage: Math.round((pagesWithSchema / (total || 1)) * 100),
      productSchemaCoverage: Math.round((result.schemaCoverage.productPages / (total || 1)) * 100),
      avgWordCount: Math.round(avgWordCount),
      hasRobotsTxt: result.hasRobotsTxt,
      hasSitemap: result.hasSitemap,
      hasLlmsTxt: result.hasLlmsTxt,
    };
  }, [result]);

  const llmSummary = useMemo(() => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (siteSummary.schemaCoverage >= 80) {
      strengths.push("Excellent structured data coverage");
    } else if (siteSummary.schemaCoverage >= 50) {
      strengths.push("Good structured data coverage");
    } else {
      weaknesses.push("Low structured data coverage");
    }

    if (siteSummary.productSchemaCoverage > 0) {
      strengths.push(`${siteSummary.productSchemaCoverage}% product schema coverage`);
    } else {
      weaknesses.push("No product schema found");
    }

    if (siteSummary.hasLlmsTxt) {
      strengths.push("llms.txt file present");
    } else {
      weaknesses.push("Missing llms.txt file");
    }

    if (siteSummary.hasRobotsTxt && siteSummary.hasSitemap) {
      strengths.push("Proper site indexing setup");
    } else {
      if (!siteSummary.hasRobotsTxt) weaknesses.push("Missing robots.txt");
      if (!siteSummary.hasSitemap) weaknesses.push("Missing sitemap.xml");
    }

    if (siteSummary.avgWordCount >= 300) {
      strengths.push(`Good content depth (~${siteSummary.avgWordCount} words avg)`);
    } else {
      weaknesses.push("Thin content");
    }

    return { strengths, weaknesses };
  }, [siteSummary]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-teal-500";
    if (score >= 60) return "from-blue-500 to-indigo-500";
    if (score >= 40) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  return (
    <div className="space-y-6">
      {/* Main Summary */}
      <div className="card-modern p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          How LLMs Understand Your Site
        </h2>

        <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              AI
            </div>
            <div>
              <div className="font-bold">{siteSummary.domain}</div>
              <div className="text-xs text-zinc-500">Entity Summary</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white/50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-2xl font-bold text-indigo-600">{siteSummary.schemaCoverage}%</div>
              <div className="text-xs text-zinc-500">Schema Coverage</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{siteSummary.productSchemaCoverage}%</div>
              <div className="text-xs text-zinc-500">Product Schema</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-2xl font-bold text-emerald-600">{siteSummary.avgWordCount}</div>
              <div className="text-xs text-zinc-500">Avg Words</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-2xl font-bold text-amber-600">{siteSummary.pagesAnalyzed}</div>
              <div className="text-xs text-zinc-500">Pages</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <span className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(result.aggregateScore)} bg-clip-text text-transparent`}>
            {result.aggregateScore}%
          </span>
          <span className="text-zinc-600 dark:text-zinc-400 text-sm">
            likelihood of being accurately referenced by AI assistants
          </span>
        </div>

        {llmSummary.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Strengths
            </h4>
            <ul className="space-y-1">
              {llmSummary.strengths.map((s, i) => (
                <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {llmSummary.weaknesses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {llmSummary.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
          Suggested User Prompts
        </h3>
        <p className="text-zinc-500 text-sm mb-4">Users might ask AI assistants questions like:</p>
        <div className="space-y-2">
          {result.llmDiscoveryPrompts.slice(0, 3).flatMap((cat) => cat.prompts.slice(0, 2)).slice(0, 5).map((prompt, index) => (
            <div key={index} className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-xl">
              <p className="text-indigo-700 dark:text-indigo-300 italic text-sm">
                &quot;{prompt}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Site Statistics */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </span>
          Site Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-sm text-zinc-500">Pages Analyzed</div>
            <div className="font-bold text-lg">{result.pagesAnalyzed}</div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-sm text-zinc-500">Avg Word Count</div>
            <div className="font-bold text-lg">{siteSummary.avgWordCount}</div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-sm text-zinc-500">robots.txt</div>
            <div className={`font-bold ${result.hasRobotsTxt ? "text-emerald-600" : "text-red-600"}`}>
              {result.hasRobotsTxt ? "Found" : "Missing"}
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-sm text-zinc-500">Sitemap</div>
            <div className={`font-bold ${result.hasSitemap ? "text-emerald-600" : "text-red-600"}`}>
              {result.hasSitemap ? `Found (${result.sitemapUrls.length})` : "Missing"}
            </div>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-sm text-zinc-500">llms.txt</div>
            <div className={`font-bold ${result.hasLlmsTxt ? "text-emerald-600" : "text-amber-600"}`}>
              {result.hasLlmsTxt ? "Found" : "Missing"}
            </div>
          </div>
        </div>
        {result.sitemapUrls.length > 0 && (
          <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-sm text-zinc-500 mb-2">Sitemap URLs:</div>
            <div className="flex flex-wrap gap-2">
              {result.sitemapUrls.map((url, i) => (
                <span key={i} className="px-2 py-1 bg-white dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {url.replace(/^https?:\/\/[^/]+/, "")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Homepage Overview */}
      {result.pages[0] && (
        <div className="card-modern p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            Homepage Overview
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-zinc-500">Title</span>
              <p className="font-medium">{result.pages[0].title || "No title found"}</p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Meta Description</span>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {result.pages[0].metaDescription || "No meta description found"}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">H1 Tags</span>
              <p className="text-sm">
                {result.pages[0].h1Texts.length > 0 ? result.pages[0].h1Texts.join(", ") : "No H1 tags found"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
