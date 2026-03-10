import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  type CodeSnippetResponse,
  parseCodeSnippetInput,
} from "@/lib/code-snippets";
import { highlightCodeSnippet } from "@/lib/shiki";

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = parseCodeSnippetInput(await request.json());

  if (!body || !body.code.trim()) {
    return NextResponse.json(
      { error: "Invalid code snippet" },
      { status: 400 },
    );
  }

  const markup = await highlightCodeSnippet(
    body.code,
    body.language,
    body.snippetId,
  );
  const response: CodeSnippetResponse = {
    markup,
  };

  return NextResponse.json(response, { status: 201 });
}
