import { type BundledLanguage, bundledLanguages } from "shiki";

export const codeSnippetLanguages = [
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "json",
  "html",
  "css",
  "bash",
  "sql",
  "python",
] as const;

export type CodeSnippetLanguage = (typeof codeSnippetLanguages)[number];

export type CodeSnippetInput = {
  code: string;
  language: CodeSnippetLanguage;
  snippetId?: string;
};

export type CodeSnippetResponse = {
  markup: string;
};

export function parseCodeSnippetInput(value: unknown): CodeSnippetInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as Record<string, unknown>;

  if (typeof input.code !== "string" || typeof input.language !== "string") {
    return null;
  }

  if (!isCodeSnippetLanguage(input.language)) {
    return null;
  }

  const output: CodeSnippetInput = {
    code: input.code,
    language: input.language,
  };

  if (typeof input.snippetId === "string" && input.snippetId.trim()) {
    const snippetId = input.snippetId
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 80);

    if (snippetId) {
      output.snippetId = snippetId;
    }
  }

  return output;
}

export function normalizeCodeSnippetLanguage(
  language: CodeSnippetLanguage,
): BundledLanguage {
  if (language in bundledLanguages) {
    return language as BundledLanguage;
  }

  return "typescript";
}

function isCodeSnippetLanguage(value: string): value is CodeSnippetLanguage {
  return codeSnippetLanguages.includes(value as CodeSnippetLanguage);
}
