import { getPageById } from "@/lib/pages";
import { notFound } from "next/navigation";

export default async function PublicPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const page = getPageById(pageId);

  if (!page || page.status !== "published") notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
          {page.content}
        </pre>
      </div>
    </main>
  );
}