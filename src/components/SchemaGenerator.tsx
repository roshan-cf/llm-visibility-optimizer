"use client";

import { useState } from "react";
import {
  generateProductSchema,
  generateFAQSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  prettyPrintSchema,
  type ProductSchema,
  type FAQSchema,
  type OrganizationSchema,
  type BreadcrumbItem,
} from "@/lib/schemas";
import { AnalysisResult } from "@/lib/types";

interface SchemaGeneratorProps {
  result: AnalysisResult;
}

export function SchemaGenerator({ result }: SchemaGeneratorProps) {
  const [activeSchema, setActiveSchema] = useState<"product" | "faq" | "organization" | "breadcrumb">("product");
  const [copied, setCopied] = useState(false);

  const [productData, setProductData] = useState<ProductSchema>({
    name: "",
    description: "",
    image: "",
    brand: "",
    price: "",
    currency: "USD",
    availability: "InStock",
    sku: "",
    url: result.mainUrl,
  });

  const [faqs, setFaqs] = useState<FAQSchema[]>([{ question: "", answer: "" }]);

  const [orgData, setOrgData] = useState<OrganizationSchema>({
    name: result.domain.split(".")[0] || "",
    url: result.mainUrl,
    logo: "",
    description: "",
  });

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { name: "Home", url: result.mainUrl },
    { name: "", url: "" },
  ]);

  const generateSchema = (): object => {
    switch (activeSchema) {
      case "product":
        return generateProductSchema(productData);
      case "faq":
        return generateFAQSchema(faqs.filter((f) => f.question && f.answer));
      case "organization":
        return generateOrganizationSchema(orgData);
      case "breadcrumb":
        return generateBreadcrumbSchema(breadcrumbs.filter((b) => b.name && b.url));
      default:
        return {};
    }
  };

  const schemaJson = prettyPrintSchema(generateSchema());

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(schemaJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mainPage = result.pages[0];

  const schemaTypes = [
    { key: "product" as const, label: "Product", icon: "📦", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
    { key: "faq" as const, label: "FAQ", icon: "❓", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
    { key: "organization" as const, label: "Organization", icon: "🏢", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
    { key: "breadcrumb" as const, label: "Breadcrumb", icon: "📍", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Schema Type Selector */}
      <div className="card-modern p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </span>
          Schema Generator
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {schemaTypes.map(({ key, label, icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveSchema(key)}
              className={`p-4 rounded-xl text-center transition-all duration-200 ${
                activeSchema === key
                  ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-sm font-medium">{label}</div>
            </button>
          ))}
        </div>

        {/* Product Schema Form */}
        {activeSchema === "product" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={productData.name}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                  className="input-modern"
                  placeholder="e.g., Wireless Bluetooth Headphones"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Brand</label>
                <input
                  type="text"
                  value={productData.brand || ""}
                  onChange={(e) => setProductData({ ...productData, brand: e.target.value })}
                  className="input-modern"
                  placeholder="Brand name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description *</label>
              <textarea
                value={productData.description}
                onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                className="input-modern resize-none"
                rows={3}
                placeholder="Describe your product..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Price</label>
                <input
                  type="text"
                  value={productData.price || ""}
                  onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                  className="input-modern"
                  placeholder="99.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Currency</label>
                <select
                  value={productData.currency || "USD"}
                  onChange={(e) => setProductData({ ...productData, currency: e.target.value })}
                  className="input-modern"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Availability</label>
                <select
                  value={productData.availability || "InStock"}
                  onChange={(e) => setProductData({ ...productData, availability: e.target.value as ProductSchema["availability"] })}
                  className="input-modern"
                >
                  <option value="InStock">In Stock</option>
                  <option value="OutOfStock">Out of Stock</option>
                  <option value="PreOrder">Pre-Order</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Schema Form */}
        {activeSchema === "faq" && (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="badge badge-info">FAQ #{index + 1}</span>
                  {faqs.length > 1 && (
                    <button
                      onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[index].question = e.target.value;
                    setFaqs(newFaqs);
                  }}
                  className="input-modern mb-2"
                  placeholder="Question"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[index].answer = e.target.value;
                    setFaqs(newFaqs);
                  }}
                  className="input-modern resize-none"
                  rows={2}
                  placeholder="Answer"
                />
              </div>
            ))}
            <button
              onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
            >
              + Add FAQ
            </button>
          </div>
        )}

        {/* Organization Schema Form */}
        {activeSchema === "organization" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Organization Name *</label>
              <input
                type="text"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={orgData.description || ""}
                onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                className="input-modern resize-none"
                rows={3}
                placeholder="Brief description of your organization"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Logo URL</label>
              <input
                type="url"
                value={orgData.logo || ""}
                onChange={(e) => setOrgData({ ...orgData, logo: e.target.value })}
                className="input-modern"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        )}

        {/* Breadcrumb Schema Form */}
        {activeSchema === "breadcrumb" && (
          <div className="space-y-3">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex gap-3 items-center">
                <span className="text-zinc-400 w-6 text-center text-sm">{index + 1}</span>
                <input
                  type="text"
                  value={crumb.name}
                  onChange={(e) => {
                    const newCrumbs = [...breadcrumbs];
                    newCrumbs[index].name = e.target.value;
                    setBreadcrumbs(newCrumbs);
                  }}
                  className="input-modern flex-1"
                  placeholder="Page name"
                />
                <input
                  type="url"
                  value={crumb.url}
                  onChange={(e) => {
                    const newCrumbs = [...breadcrumbs];
                    newCrumbs[index].url = e.target.value;
                    setBreadcrumbs(newCrumbs);
                  }}
                  className="input-modern flex-1"
                  placeholder="URL"
                />
                {breadcrumbs.length > 1 && (
                  <button
                    onClick={() => setBreadcrumbs(breadcrumbs.filter((_, i) => i !== index))}
                    className="text-red-500 px-2 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setBreadcrumbs([...breadcrumbs, { name: "", url: "" }])}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
            >
              + Add Breadcrumb
            </button>
          </div>
        )}
      </div>

      {/* Generated Schema Output */}
      <div className="card-modern p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Generated Schema</h3>
          <button
            onClick={copyToClipboard}
            className={`btn-secondary flex items-center gap-2 ${copied ? "!bg-emerald-100 !text-emerald-700 dark:!bg-emerald-900/30 dark:!text-emerald-400" : ""}`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy JSON-LD
              </>
            )}
          </button>
        </div>
        <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl overflow-x-auto text-sm font-mono">
          <code>{schemaJson}</code>
        </pre>
        <p className="mt-4 text-sm text-zinc-500">
          Add this to your page&apos;s &lt;head&gt; section wrapped in <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">&lt;script type=&quot;application/ld+json&quot;&gt;</code>
        </p>
      </div>

      {/* Existing Schemas */}
      {mainPage && mainPage.jsonLdScripts.length > 0 && (
        <div className="card-modern p-6">
          <h3 className="text-lg font-semibold mb-4">Existing Schemas Detected</h3>
          <div className="space-y-3">
            {mainPage.jsonLdScripts.map((schema, index) => (
              <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <span className="badge badge-info mb-2">
                  {String((schema as Record<string, unknown>)["@type"] || "Unknown")}
                </span>
                <pre className="text-xs overflow-x-auto text-zinc-600 dark:text-zinc-400">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
