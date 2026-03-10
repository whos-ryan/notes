import { codeToHtml } from "shiki";
import {
  type CodeSnippetLanguage,
  normalizeCodeSnippetLanguage,
} from "@/lib/code-snippets";

export async function highlightCodeSnippet(
  code: string,
  language: CodeSnippetLanguage,
  snippetId?: string,
) {
  const html = await codeToHtml(code, {
    lang: normalizeCodeSnippetLanguage(language),
    theme: "github-dark",
  });

  const withoutBackground = html.replace(
    /style="([^"]*)"/g,
    (_match, styles: string) => {
      const nextStyles = styles
        .split(";")
        .map((style) => style.trim())
        .filter(
          (style) =>
            style.length > 0 &&
            !style.startsWith("background") &&
            !style.startsWith("background-color"),
        )
        .join("; ");

      return nextStyles ? `style="${nextStyles}"` : "";
    },
  );

  const encodedCode = encodeURIComponent(code);
  const nextSnippetId = snippetId ?? crypto.randomUUID();

  return `<div data-code-snippet="true" data-code-snippet-id="${nextSnippetId}" data-code-snippet-language="${language}" data-code-snippet-value="${encodedCode}" contenteditable="false" class="relative my-4 rounded-2xl border border-dashed border-white/15 bg-background/90 p-3"><div class="overflow-x-auto font-mono text-[15px] leading-7 text-foreground/95">${withoutBackground}</div></div><p><br></p>`;
}
