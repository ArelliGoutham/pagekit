import { getPages } from "@/lib/pages";
import { PagesTable } from "./pages-table";

export default async function AdminPagesPage() {
  const pages = getPages();
  return <PagesTable pages={pages} />;
}
