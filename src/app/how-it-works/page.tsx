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
            <h2 className="text-3xl font-bold">Two-Layer Scoring Model</h2>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              We measure <strong>two distinct questions</strong> LLMs answer when users search for products:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Layer 1: Site Discoverability
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  <strong>"Where can I buy X?"</strong>
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  Can LLMs discover your brand when users search for products in your category? Measures site-wide factors like llms.txt, AI crawler access, sitemap, and organization schema.
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-3">
                  Layer 2: Product Extractability
                </h3>
                <p className="text-emerald-700 dark:text-emerald-300 text-sm mb-4">
                  <strong>"Is THIS product good?"</strong>
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                  Can LLMs understand your product and recommend it? Measures product-specific factors like schema, pricing, availability, ratings, and specifications.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 mb-8 border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">Key Insight: Schema vs. Content</h4>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-2">
                Sites like Amazon have minimal schema markup but score well because their content is highly extractable — prices, ratings, and availability are visible in text patterns LLMs can parse.
              </p>
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                We score based on <strong>information presence</strong>, not just schema presence.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-4">Layer 1: Site Discoverability Breakdown</h3>
            <div className="space-y-4 mb-10">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">llms.txt Presence</span>
                  <span className="badge badge-info">High Impact</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Binary: present (full points) or missing (zero). The new standard for LLM discoverability.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">AI Crawler Access</span>
                  <span className="badge badge-info">High Impact</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Checks robots.txt for OAI-SearchBot, GPTBot, ChatGPT-User. These bots power ChatGPT Shopping results.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Sitemap & Organization Schema</span>
                  <span className="badge badge-warning">Medium Impact</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sitemap helps crawlers discover pages. Organization schema builds brand identity for LLMs.
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-red-800 dark:text-red-200">External Mentions & Domain Authority</span>
                  <span className="badge badge-error">Can't Measure</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  These are CRITICAL for actual LLM visibility but require external data. We show recommendations instead of scores.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4">Layer 2: Product Extractability Breakdown</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Only product pages receive extractability scores. Homepages, blogs, and utility pages are marked N/A.
            </p>

            <div className="space-y-6">
              <ScoreFactor 
                title="Product Schema (25 points)" 
                weight={25}
                impact="Critical"
                calculation="Name: 5pts. Description: 5pts. Image: 5pts. Offers: 5pts. Complete schema: bonus 5pts."
                why="Structured data is the fastest, most reliable way for LLMs to understand your product."
              />
              
              <ScoreFactor 
                title="Identifiers (15 points)" 
                weight={15}
                impact="High"
                calculation="GTIN: 5pts. MPN: 5pts. SKU: 5pts. At least one identifier strongly recommended."
                why="GTIN/MPN/SKU help LLMs match your product across platforms and price comparison sites."
              />

              <ScoreFactor 
                title="Pricing (15 points)" 
                weight={15}
                impact="Critical"
                calculation="Price: 12pts (schema OR $₹€£ pattern). Currency: 3pts (schema OR symbol detection)."
                why="Price is essential for shopping queries. LLMs need to know the cost to recommend."
              />

              <ScoreFactor 
                title="Availability (10 points)" 
                weight={10}
                impact="High"
                calculation="Stock Status: 10pts (schema OR 'In Stock' text OR 'Add to Cart' button)."
                why="LLMs won't recommend products that are out of stock."
              />

              <ScoreFactor 
                title="Ratings & Reviews (20 points)" 
                weight={20}
                impact="High"
                calculation="Rating: 10pts (schema OR ★★★★☆ pattern). Review Count: 10pts."
                why="Social proof is critical. LLMs prefer products with ratings and reviews."
              />

              <ScoreFactor 
                title="Images & Specifications (15 points)" 
                weight={15}
                impact="Medium"
                calculation="Images: 8pts (count + alt text). Specs: 7pts (table/list detected)."
                why="Visual and detailed specs help LLMs answer comparison questions."
              />

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-red-800 dark:text-red-200">Third-Party Reviews</span>
                  <span className="badge badge-error">Can't Measure</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Reviews on Reddit, forums, and external sites impact LLM recommendations heavily but require external data.
                </p>
              </div>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold">⚠</div>
            <h2 className="text-3xl font-bold">Important Limitations</h2>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 mb-6 border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">Why Amazon Scores Low But Ranks High</h4>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
                Amazon.in scores ~10/100 on our technical metrics but dominates LLM results. This is because:
              </p>
              <ul className="text-amber-600 dark:text-amber-400 text-sm space-y-1">
                <li>• <strong>Training Data:</strong> Amazon is in ChatGPT's training data — millions of product pages were crawled</li>
                <li>• <strong>Domain Authority:</strong> One of the most linked-to sites globally</li>
                <li>• <strong>Brand Recognition:</strong> "Amazon" is a known entity LLMs recognize instantly</li>
                <li>• <strong>Citation Density:</strong> Cited everywhere (reviews, news, blogs, forums)</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-4">What We CAN'T Measure</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Training Data Inclusion</h4>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Has your site been crawled for LLM training? Only the LLM providers know. Sites in training data have a massive advantage.
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Domain Authority</h4>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  How many sites link to you? Requires external data from Ahrefs, Moz, etc. Established brands have inherent advantage.
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Brand Recognition</h4>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Is your brand a "known entity" to LLMs? Nike, Amazon, Apple = instant recognition. New brands start at zero.
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Citation Density</h4>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  How often is your content cited across the web? Wikipedia mentions, blog references, Reddit discussions drive LLM recommendations.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4">Tradeoffs We Made</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <h4 className="font-medium mb-2">1. Schema vs. Content Detection</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Tradeoff:</strong> We detect both, but schema gets bonus points.<br/>
                  <strong>Reason:</strong> Schema is faster/more reliable for LLMs, but content extraction works.<br/>
                  <strong>Impact:</strong> Sites with good content but no schema score decent; sites with schema score better.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <h4 className="font-medium mb-2">2. Page-Level vs. Site-Level</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Tradeoff:</strong> Separate scores for pages and overall site.<br/>
                  <strong>Reason:</strong> Product pages need different scoring than homepage/collections.<br/>
                  <strong>Impact:</strong> More complex but more accurate.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <h4 className="font-medium mb-2">3. Industry-Specific vs. Generic</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Tradeoff:</strong> Optimized for e-commerce, may not suit other industries.<br/>
                  <strong>Reason:</strong> Our target users are e-commerce sites.<br/>
                  <strong>Impact:</strong> Won't work well for blogs, SaaS, service businesses.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <h4 className="font-medium mb-2">4. What We Show vs. Hide</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Tradeoff:</strong> We show limitations prominently.<br/>
                  <strong>Reason:</strong> Honesty &gt; false promises.<br/>
                  <strong>Impact:</strong> Users understand the gap between score and reality.
                </p>
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
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{weight}pts max</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            impact === "Critical" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
            impact === "High" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" :
            impact === "Bonus" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
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
