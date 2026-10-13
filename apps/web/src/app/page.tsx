import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-5xl font-bold mb-4">📄 PageKit</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md text-center">
        Open-source, self-hosted documentation platform.
        MDX. API references. Wiki pages. All in one.
      </p>
      <div className="flex gap-4">
        <Link
          href="/admin"
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
        >
          Admin Portal
        </Link>
        <Link
          href="https://github.com/pagekit/pagekit"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          GitHub →
        </Link>
      </div>
    </main>
  );
}