import { SplitPanelEditor } from "./editor-client";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  return <SplitPanelEditor pageId={pageId} />;
}