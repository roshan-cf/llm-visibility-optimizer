"use client";

import { useMemo } from "react";
import { AnalysisResult } from "@/lib/types";

interface ContentAuditProps {
  result: AnalysisResult;
}

export function ContentAudit({ result }: ContentAuditProps) {
  const audit = useMemo(() => {
    const pages = result.pages;
    const total = pages.length;

    const avgWordCount = total > 0
      ? Math.round(pages.reduce((sum, p) => sum + p.wordCount, 0) / total)
      : 0;

    const pagesWithThinContent = pages.filter(p => p.wordCount < 300).length;
    const pagesWithGoodContent = pages.filter(p => p.wordCount >= 500).length;

    const pagesWithMissingH1 = pages.filter(p => p.headings.h1 === 0).length;
    const pagesWithMultipleH1 = pages.filter(p => p.headings.h1 > 1).length;
    const pagesWithProperH1 = pages.filter(p => p.headings.h1 === 1).length;

    const totalImages = pages.reduce((sum, p) => sum + p.images.total, 0);
    const totalImagesWithAlt = pages.reduce((sum, p) => sum + p.images.withAlt, 0);
    const imageAltCoverage = totalImages > 0
      ? Math.round((totalImagesWithAlt / totalImages) * 100)
      : 100;

    const pagesWithMissingMeta = pages.filter(p => p.metaDescription.length < 120).length;

    const totalHeadings = pages.reduce((sum, p) => 
      sum + p.headings.h1 + p.headings.h2 + p.headings.h3 + p.headings.h4 + p.headings.h5 + p.headings.h6, 0
    );
    const avgHeadingsPerPage = total > 0 ? Math.round(totalHeadings / total) : 0;

    const issues: string[] = [];
    if (pagesWithThinContent > 0) issues.push(`${pagesWithThinContent} pages have thin content (<300 words)`);
    if (pagesWithMissingH1 > 0) issues.push(`${pagesWithMissingH1} pages are missing H1 tags`);
    if (pagesWithMultipleH1 > 0) issues.push(`${pagesWithMultipleH1} pages have multiple H1 tags`);
    if (imageAltCoverage < 80) issues.push(`Only ${imageAltCoverage}% of images have alt text`);
    if (pagesWithMissingMeta > total * 0.5) issues.push(`${pagesWithMissingMeta} pages have inadequate meta descriptions`);

    const strengths: string[] = [];
    if (pagesWithGoodContent > total * 0.5) strengths.push(`${pagesWithGoodContent} pages have good content depth (500+ words)`);
    if (pagesWithProperH1 > total * 0.8) strengths.push(`${pagesWithProperH1} pages have proper H1 structure`);
    if (imageAltCoverage >= 90) strengths.push(`${imageAltCoverage}% of images have alt text`);
    if (avgHeadingsPerPage >= 5) strengths.push(`Good heading structure (~${avgHeadingsPerPage} headings per page)`);

    const overallScore = Math.round(
      (Math.min(100, avgWordCount / 5) * 0.2) +
      ((pagesWithProperH1 / (total || 1)) * 100 * 0.2) +
      (imageAltCoverage * 0.15) +
      ((pagesWithGoodContent / (total || 1)) * 100 * 0.15) +
      ((1 - pagesWithMissingMeta / (total || 1)) * 100 * 0.15) +
      (result.hasRobotsTxt && result.hasSitemap ? 15 : 0)
    );

    return {
      avgWordCount,
      totalPages: total,
      totalHeadings,
      avgHeadingsPerPage,
      imageAltCoverage,
      totalImages,
      totalImagesWithAlt,
      pagesWithThinContent,
      pagesWithGoodContent,
      pagesWithProperH1,
      pagesWithMissingH1,
      pagesWithMultipleH1,
      pagesWithMissingMeta,
      issues,
      strengths,
      overallScore,
    };
  }, [result]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "from-emerald-500 to-teal-500";
    if (score >= 50) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return { text: "Good", badge: "badge-success" };
    if (score >= 50) return { text: "Needs Work", badge: "badge-warning" };
    return { text: "Poor", badge: "badge-error" };
  };

  const scoreInfo = getScoreLabel(audit.overallScore);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="card-modern p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Content Quality Score
        </h2>
        <div className="flex items-center gap-4">
          <span className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(audit.overallScore)} bg-clip-text text-transparent`}>
            {audit.overallScore}
          </span>
          <div>
            <span className={`badge ${scoreInfo.badge}`}>{scoreInfo.text}</span>
            <p className="text-sm text-zinc-500 mt-1">Based on {audit.totalPages} pages analyzed</p>
          </div>
        </div>
      </div>

      {/* Content Overview */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4">Content Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="text-2xl font-bold text-blue-600">{audit.avgWordCount}</div>
            <div className="text-xs text-zinc-500 mt-1">Avg Words/Page</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-bold text-purple-600">{audit.avgHeadingsPerPage}</div>
            <div className="text-xs text-zinc-500 mt-1">Avg Headings</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-bold text-emerald-600">{audit.imageAltCoverage}%</div>
            <div className="text-xs text-zinc-500 mt-1">Images with Alt</div>
          </div>
        </div>
      </div>

      {/* Heading Structure */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4">Heading Structure</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-center">
            <div className="text-2xl font-bold text-emerald-600">{audit.pagesWithProperH1}</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Proper H1</div>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/50 text-center">
            <div className="text-2xl font-bold text-red-600">{audit.pagesWithMissingH1}</div>
            <div className="text-xs text-red-700 dark:text-red-400 mt-1">Missing H1</div>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 text-center">
            <div className="text-2xl font-bold text-amber-600">{audit.pagesWithMultipleH1}</div>
            <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">Multiple H1</div>
          </div>
        </div>
      </div>

      {/* Content Depth */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4">Content Depth</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <div className="text-2xl font-bold text-emerald-600">{audit.pagesWithGoodContent}</div>
            <div className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Good content (500+ words)</div>
          </div>
          <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/50">
            <div className="text-2xl font-bold text-red-600">{audit.pagesWithThinContent}</div>
            <div className="text-sm text-red-700 dark:text-red-400 mt-1">Thin content (&lt;300 words)</div>
          </div>
        </div>
      </div>

      {/* Strengths & Issues */}
      {audit.strengths.length > 0 && (
        <div className="card-modern p-6">
          <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Strengths
          </h4>
          <ul className="space-y-1">
            {audit.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.issues.length > 0 && (
        <div className="card-modern p-6">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Issues Found
          </h4>
          <ul className="space-y-1">
            {audit.issues.map((issue, index) => (
              <li key={index} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <span className="text-red-500">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Page-by-Page Details */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Page-by-Page Details
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {result.pages.map((page, index) => (
            <div key={index} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-sm font-medium truncate text-indigo-600 dark:text-indigo-400 mb-1">
                {page.url.replace(/^https?:\/\//, "")}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded">{page.wordCount} words</span>
                <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded">H1: {page.headings.h1}</span>
                <span className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded">Images: {page.images.total}</span>
                <span className={`px-2 py-0.5 rounded ${
                  page.metaDescription.length >= 120 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" 
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                }`}>
                  Meta: {page.metaDescription.length} chars
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
