import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | LLM Visibility Optimizer",
  description: "Understand the methodology behind LLM visibility scoring and how to optimize for AI assistants",
};

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-6">
            How It Works
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A deep dive into the methodology, scoring algorithms, and best practices for LLM visibility optimization
          </p>
        </header>

        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">?</div>
            <h2 className="text-3xl font-bold">What is LLM Visibility?</h2>
          </div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              <strong className="text-gray-900 dark:text-white">LLM Visibility</strong> measures how effectively your website can be discovered, understood, and referenced by Large Language Models like ChatGPT, Claude, Gemini, and Perplexity. Unlike traditional SEO which targets search engine algorithms, LLM visibility focuses on making your content machine-readable and semantically meaningful to AI systems.
            </p>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-8 my-8 border border-amber-200 dark:border-amber-800">
              <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4">Why This Matters Now</h3>
              <p className="text-amber-800 dark:text-amber-200">
                By 2025, an estimated 30% of web searches will be performed by AI assistants. When users ask ChatGPT "What's the best organic skincare brand?" or "Where can I buy affordable wireless earbuds?", your business needs to be part of the answer—not just the search results.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">⚙</div>
            <h2 className="text-3xl font-bold">The Scoring Methodology</h2>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Our visibility score (0-100) is calculated using a weighted algorithm that prioritizes factors most influential to LLM understanding and citation.
            </p>

            <div className="space-y-6">
              <ScoreFactor 
                title="Structured Data (JSON-LD)" 
                weight={25}
                impact="Critical"
                calculation="Base: 0 points. +15pts if any schema present. +10pts if Product schema. +5pts if Organization schema."
                why="LLMs use schema.org markup as the primary source of structured entity information. A product schema tells the AI exactly what your product is, its price, and availability—eliminating ambiguity."
              />
              
              <ScoreFactor 
                title="Review & Rating Schema" 
                weight={15}
                impact="High"
                calculation="Base: 0 points. +10pts if Review or AggregateRating schema detected. +5pts if both present."
                why="Reviews provide social proof that LLMs reference when making recommendations. An AI is more likely to recommend a 4.5-star product with 500 reviews than one without ratings."
              />

              <ScoreFactor 
                title="Content Freshness" 
                weight={15}
                impact="High"
                calculation="Score based on days since last update: ≤30 days: 100pts, ≤90 days: 80pts, ≤180 days: 60pts, >180 days: 30pts"
                why="LLMs prioritize current information. Content freshness signals that your data is accurate and up-to-date, increasing citation likelihood."
              />

              <ScoreFactor 
                title="Quote-Ready Snippets" 
                weight={10}
                impact="Medium"
                calculation="0-5 snippets: 0-50pts. Each self-contained, factual sentence (10-35 words) adds points."
                why="LLMs quote directly from sources. Short, declarative sentences like 'Our moisturizer contains 95% organic ingredients' are more likely to be cited verbatim."
              />

              <ScoreFactor 
                title="Meta Descriptions" 
                weight={10}
                impact="Medium"
                calculation="0pts if missing. 50pts if present but <120 chars. 100pts if 120-160 chars."
                why="Meta descriptions are often used as the 'answer snippet' when LLMs summarize your page. They're the elevator pitch for your content."
              />

              <ScoreFactor 
                title="Author/Expertise Signals" 
                weight={10}
                impact="Medium"
                calculation="0pts if no author. +5pts if author name present. +5pts if credentials/bio available."
                why="E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals help LLMs assess content credibility and are more likely to cite expert sources."
              />

              <ScoreFactor 
                title="Heading Structure" 
                weight={5}
                impact="Low"
                calculation="0pts if no H1. 50pts if multiple H1s. 100pts if exactly one H1 with proper H2-H6 hierarchy."
                why="Proper heading hierarchy helps LLMs understand content organization and extract key topics."
              />

              <ScoreFactor 
                title="Technical SEO (robots.txt, sitemap)" 
                weight={5}
                impact="Low"
                calculation="Binary: 100pts if present, 0pts if missing."
                why="These files help crawlers discover your content. Without them, AI crawlers may miss entire sections of your site."
              />
            </div>

            <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4">Final Score Calculation</h3>
              <code className="text-sm bg-slate-100 dark:bg-slate-800 p-4 rounded-lg block overflow-x-auto">
                Final Score = (Factor_1 × Weight_1) + (Factor_2 × Weight_2) + ... + (Factor_n × Weight_n)
              </code>
              <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">
                The weighted average produces a score where perfect structured data with fresh content and author attribution yields ~90-100, while a basic page with no schema yields ~40-50.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">📊</div>
            <h2 className="text-3xl font-bold">What We Analyze</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <AnalysisCard
              icon="🔍"
              title="Visibility Score"
              description="Comprehensive page-by-page analysis with aggregate site scoring"
              items={[
                "JSON-LD structured data detection",
                "Schema type identification (Product, Organization, FAQ, Review)",
                "Meta tag completeness",
                "Semantic HTML structure",
                "Image alt text coverage",
              ]}
            />
            
            <AnalysisCard
              icon="💬"
              title="Quote-Ready Snippets"
              description="Identifies sentences LLMs can cite directly"
              items={[
                "10-35 word self-contained sentences",
                "Factual, declarative statements",
                "Subject-predicate clarity check",
                "Numbers and specifics detection",
              ]}
            />
            
            <AnalysisCard
              icon="📅"
              title="Content Freshness"
              description="Timestamps and update frequency analysis"
              items={[
                "Published/modified date extraction",
                "JSON-LD datePublished/dateModified",
                "Open Graph article timestamps",
                "Time element parsing",
              ]}
            />
            
            <AnalysisCard
              icon="👤"
              title="Author Attribution"
              description="E-E-A-T signal detection"
              items={[
                "Author meta tags",
                "Person schema markup",
                "rel='author' links",
                "Credential and bio extraction",
              ]}
            />

            <AnalysisCard
              icon="⭐"
              title="Reviews & Ratings"
              description="Social proof signal detection"
              items={[
                "Review schema detection",
                "AggregateRating extraction",
                "Rating value and count",
                "Review count analysis",
              ]}
            />

            <AnalysisCard
              icon="🤖"
              title="LLM Discovery Test"
              description="Simulate how LLMs might find and describe your site"
              items={[
                "Brand discovery prompts",
                "Product recommendation simulation",
                "Comparison shopping queries",
                "Trust & credibility tests",
              ]}
            />
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold">🎯</div>
            <h2 className="text-3xl font-bold">AI Traffic Estimation</h2>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              The AI traffic estimate projects potential monthly visitors from LLM-generated referrals (ChatGPT, Claude, Gemini, Perplexity).
            </p>

            <div className="space-y-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <h4 className="font-semibold mb-2">Formula</h4>
                <code className="text-sm">Estimated Traffic = (AvgScore/100) × Multiplier × totalPages × BaseVisits</code>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Multipliers Applied</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Schema coverage bonus: up to +50%</li>
                    <li>• Product schema: +30%</li>
                    <li>• Content depth (&gt;500 words): +20%</li>
                    <li>• llms.txt present: +15%</li>
                  </ul>
                </div>

                <div className="p-5 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                  <h4 className="font-semibold text-violet-800 dark:text-violet-200 mb-2">Platform Distribution</h4>
                  <ul className="text-sm text-violet-700 dark:text-violet-300 space-y-1">
                    <li>• ChatGPT: 45%</li>
                    <li>• Gemini: 20%</li>
                    <li>• Claude: 15%</li>
                    <li>• Perplexity: 12%</li>
                    <li>• Other: 8%</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Confidence Levels</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300">
                  <li><strong>High:</strong> ≥50 pages analyzed, ≥50% schema coverage</li>
                  <li><strong>Medium:</strong> ≥20 pages analyzed</li>
                  <li><strong>Low:</strong> &lt;20 pages analyzed</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">🚀</div>
            <h2 className="text-3xl font-bold">Best Practices</h2>
          </div>

          <div className="space-y-4">
            <PracticeCard 
              number={1}
              title="Implement Product Schema on All Product Pages"
              description="Add JSON-LD markup including name, description, price, availability, brand, SKU, and images. This is the single highest-impact optimization."
              impact="+25 score points"
            />
            <PracticeCard 
              number={2}
              title="Add AggregateRating Schema"
              description="Include rating value and review count in your product schema. LLMs prioritize products with social proof."
              impact="+10 score points"
            />
            <PracticeCard 
              number={3}
              title="Create Quote-Ready Content"
              description="Write short, factual sentences that can be quoted directly. Avoid vague statements. Use specific numbers and claims."
              impact="Higher citation rate"
            />
            <PracticeCard 
              number={4}
              title="Maintain Content Freshness"
              description="Update product pages regularly. Add 'last updated' timestamps. LLMs favor current information."
              impact="+15 score points"
            />
            <PracticeCard 
              number={5}
              title="Add Author Attribution"
              description="Include author names, credentials, and bios on content pages. This builds E-E-A-T signals that LLMs reference for credibility."
              impact="+10 score points"
            />
            <PracticeCard 
              number={6}
              title="Create an llms.txt File"
              description="Add a /llms.txt file at your site root with structured information specifically for LLM crawlers. This is becoming the standard for AI discoverability."
              impact="+15% traffic estimate"
            />
          </div>
        </section>

        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-10 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Optimize?</h2>
            <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
              Enter your e-commerce website URL to get a comprehensive LLM visibility analysis with actionable recommendations.
            </p>
            <a 
              href="/"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Analyze Your Website →
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function ScoreFactor({ 
  title, 
  weight, 
  impact, 
  calculation, 
  why 
}: { 
  title: string; 
  weight: number; 
  impact: string; 
  calculation: string; 
  why: string;
}) {
  return (
    <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{weight}% weight</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            impact === "Critical" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
            impact === "High" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" :
            "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
          }`}>
            {impact}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        <strong className="text-gray-700 dark:text-gray-300">Calculation:</strong> {calculation}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500">
        <strong className="text-gray-600 dark:text-gray-400">Why it matters:</strong> {why}
      </p>
    </div>
  );
}

function AnalysisCard({ 
  icon, 
  title, 
  description, 
  items 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  items: string[];
}) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="text-blue-500 mt-0.5">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PracticeCard({ 
  number, 
  title, 
  description, 
  impact 
}: { 
  number: number; 
  title: string; 
  description: string; 
  impact: string;
}) {
  return (
    <div className="flex gap-5 p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{description}</p>
        <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
          {impact}
        </span>
      </div>
    </div>
  );
}
