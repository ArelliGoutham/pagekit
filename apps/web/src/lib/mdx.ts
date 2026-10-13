import { compile } from "@mdx-js/mdx";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export async function compileMdx(source: string) {
  const result = await compile(source, {
    outputFormat: "function-body",
    rehypePlugins: [rehypeHighlight, rehypeSlug, rehypeAutolinkHeadings],
    development: false,
  });
  return String(result.value);
}