"use client";

import { useState } from "react";

interface Action {
  label: string;
  type: "copy" | "link" | "download";
  content?: string;
  url?: string;
}

interface ActionCardProps {
  title: string;
  severity: "critical" | "warning" | "info";
  description: string;
  actions: Action[];
}

export function ActionCard({ title, severity, description, actions }: ActionCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const severityStyles = {
    critical: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  };

  const badgeStyles = {
    critical: "badge-error",
    warning: "badge-warning",
    info: "badge-info",
  };

  return (
    <div className={`p-4 rounded-xl border ${severityStyles[severity]}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <span className={`badge ${badgeStyles[severity]} text-xs`}>{severity}</span>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => {
          if (action.type === "copy") {
            return (
              <button
                key={i}
                onClick={() => handleCopy(action.content!, action.label)}
                className="btn-secondary text-xs py-1 px-3"
              >
                {copied === action.label ? "Copied!" : action.label}
              </button>
            );
          } else if (action.type === "link") {
            return (
              <a
                key={i}
                href={action.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1 px-3 inline-flex items-center gap-1"
              >
                {action.label}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            );
          } else if (action.type === "download") {
            return (
              <button
                key={i}
                onClick={() => handleDownload(action.content!, action.label)}
                className="btn-primary text-xs py-1 px-3"
              >
                {action.label}
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
