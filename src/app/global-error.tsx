"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Something went wrong!</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error.message}</p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
