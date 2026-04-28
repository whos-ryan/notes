import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  type CodeSnippetResponse,
  parseCodeSnippetInput,
} from "@/lib/code-snippets";
import { codeSnippetMaxLength } from "@/lib/content-safety";
import {
  clampText,
  getClientKey,
  rateLimit,
  readJsonBody,
} from "@/lib/security";
import { highlightCodeSnippet } from "@/lib/shiki";

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit({
    key: `highlight:${getClientKey(request, session.user.id)}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const json = await readJsonBody(request);

  if (json.error) {
    return NextResponse.json({ error: json.error }, { status: 400 });
  }

  const body = parseCodeSnippetInput(json.value);

  if (!body || !body.code.trim()) {
    return NextResponse.json(
      { error: "Invalid code snippet" },
      { status: 400 },
    );
  }

  const markup = await highlightCodeSnippet(
    clampText(body.code, codeSnippetMaxLength),
    body.language,
    body.snippetId,
  );
  const response: CodeSnippetResponse = {
    markup,
  };

  return NextResponse.json(response, { status: 201 });
}
