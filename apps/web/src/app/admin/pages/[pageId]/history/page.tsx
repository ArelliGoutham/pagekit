import { getPageById, getPageRevisions } from "@/lib/pages";
import { DiffClient } from "./diff-client";

export default async function PageHistoryPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const page = getPageById(pageId);
  const revisions = getPageRevisions(pageId);

  if (!page) return <p>Page not found.</p>;

  return <DiffClient page={page} revisions={revisions} />;
}