import { ThemeEditorClient } from "./theme-editor-client";

export default function ThemeEditorPage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  return <ThemeEditorClient params={params} />;
}