import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".next/",
      "dist/",
      ".turbo/",
      "node_modules/",
      ".worktrees/",
      "drizzle/",
      "**/components/ui/",      // shadcn/ui generated
      "**/next-env.d.ts",      // Next.js auto-generated
    ],
  },
);