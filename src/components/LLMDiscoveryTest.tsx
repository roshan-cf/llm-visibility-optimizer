"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";

interface LLMDicoveryTestProps {
  result: AnalysisResult;
}

export function LLMDicoveryTest({ result }: LLMDicoveryTestProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const brandName = result.domain.split(".")[0]?.replace(/-/g, " ") || "this store";

  const simulateLLMResponse = (prompt: string): { found: boolean; confidence: string; response: string } => {
    const hasOrgSchema = result.schemaCoverage.organizationPages > 0;
    const hasProductSchema = result.schemaCoverage.productPages > 0;
    const avgScore = result.aggregateScore;

    const promptLower = prompt.toLowerCase();
    
    const isBrandQuery = promptLower.includes(brandName.toLowerCase()) || 
      promptLower.includes("this store") || 
      promptLower.includes("this website");
    
    const isProductQuery = promptLower.includes("product") || 
      promptLower.includes("sell") || 
      promptLower.includes("buy") ||
      promptLower.includes("shop");
    
    const isTrustQuery = promptLower.includes("trust") || 
      promptLower.includes("legit") || 
      promptLower.includes("scam") ||
      promptLower.includes("review");

    let found = false;
    let confidence = "low";
    let response = "";

    if (isBrandQuery && hasOrgSchema && avgScore >= 60) {
      found = true;
      confidence = avgScore >= 80 ? "high" : "medium";
      response = `Based on available information, ${brandName} is an e-commerce website${result.pages[0]?.metaDescription ? ` that ${result.pages[0].metaDescription.toLowerCase().slice(0, 100)}...` : ""}. The site has structured data which helps verify its legitimacy.`;
    } else if (isBrandQuery && !hasOrgSchema) {
      found = true;
      confidence = "low";
      response = `I found ${brandName} but have limited structured information about this business.`;
    } else if (isProductQuery && hasProductSchema) {
      found = true;
      confidence = avgScore >= 70 ? "high" : "medium";
      response = `${brandName} offers various products with ${result.schemaCoverage.productPages} product pages having structured data.`;
    } else if (isProductQuery && !hasProductSchema) {
      found = false;
      confidence = "low";
      response = `I found limited product information for ${brandName}. The site lacks product schema markup.`;
    } else if (isTrustQuery && hasOrgSchema) {
      found = true;
      confidence = "medium";
      response = `${brandName} appears to be a legitimate e-commerce website with proper structured data implementation.`;
    } else if (isTrustQuery) {
      found = false;
      confidence = "low";
      response = `I have limited information to verify the trustworthiness of ${brandName}.`;
    } else {
      found = avgScore >= 50;
      confidence = avgScore >= 70 ? "high" : avgScore >= 50 ? "medium" : "low";
      response = found 
        ? `I can find some information about ${brandName}.`
        : `I have limited information about ${brandName}.`;
    }

    return { found, confidence, response };
  };

  return (
    <div className="space-y-6">
      {/* Custom Prompt Test */}
      <div className="card-modern p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          LLM Discovery Simulator
        </h2>
        <p className="text-zinc-500 text-sm mb-4">Test how AI assistants might respond when users search for your website</p>
        
        <div>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={`e.g., "What is ${brandName}?" or "Best products on ${brandName}"`}
            className="input-modern"
          />
          {customPrompt && (
            <div className="mt-4 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-l-4 border-indigo-500">
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${simulateLLMResponse(customPrompt).confidence === "high" ? "badge-success" : simulateLLMResponse(customPrompt).confidence === "medium" ? "badge-warning" : "badge-error"}`}>
                  {simulateLLMResponse(customPrompt).confidence} confidence
                </span>
                <span className={`badge ${simulateLLMResponse(customPrompt).found ? "badge-info" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                  {simulateLLMResponse(customPrompt).found ? "Would mention site" : "Limited visibility"}
                </span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 italic text-sm">
                &quot;{simulateLLMResponse(customPrompt).response}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Common Prompts */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
          Common Discovery Prompts
        </h3>

        <div className="space-y-2">
          {result.llmDiscoveryPrompts.map((category, index) => (
            <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.category ? null : category.category)}
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{category.category}</span>
                  <span className={`badge ${category.likelihood === "high" ? "badge-success" : category.likelihood === "medium" ? "badge-warning" : "badge-error"}`}>
                    {category.likelihood}
                  </span>
                </div>
                <svg 
                  className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${expandedCategory === category.category ? "rotate-180" : ""}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedCategory === category.category && (
                <div className="px-4 pb-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                  {category.prompts.map((prompt, pIndex) => {
                    const sim = simulateLLMResponse(prompt);
                    return (
                      <div key={pIndex} className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                        <p className="font-medium text-sm mb-2">&quot;{prompt}&quot;</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`badge ${sim.confidence === "high" ? "badge-success" : sim.confidence === "medium" ? "badge-warning" : "badge-error"}`}>
                            {sim.confidence} confidence
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 italic">&quot;{sim.response}&quot;</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sitemap Discovery */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </span>
          Sitemap Discovery
        </h3>
        {result.sitemapUrls.length > 0 ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Found {result.sitemapUrls.length} sitemap(s)</span>
            </div>
            <div className="space-y-1">
              {result.sitemapUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-emerald-500">•</span>
                  <code className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded text-xs">{url}</code>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">No Sitemaps Found</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No sitemap files were discovered. Add a sitemap.xml file to help search engines and AI crawlers discover your pages.
            </p>
          </div>
        )}
      </div>

      {/* llms.txt Status */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          llms.txt Status
        </h3>
        {result.hasLlmsTxt ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">llms.txt Found</span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">Your site is optimized for LLM crawlers.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">llms.txt Not Found</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              llms.txt is a new standard for providing structured information to LLMs. 
              It helps AI assistants better understand and represent your website.
            </p>
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl text-xs font-mono border border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-400 mb-2"># Example llms.txt</p>
              <pre className="text-zinc-600 dark:text-zinc-400 overflow-x-auto">{`# ${result.domain}
> ${result.pages[0]?.title || "Your Website Description"}

## Products
- List your main product categories

## Links
- [Products](https://${result.domain}/products)`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
