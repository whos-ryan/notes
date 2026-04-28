import sanitizeHtml from "sanitize-html";

export const noteTitleMaxLength = 200;
export const noteContentMaxLength = 200_000;
export const noteIconMaxLength = 80;
export const folderNameMaxLength = 120;
export const calendarTitleMaxLength = 200;
export const calendarDescriptionMaxLength = 20_000;
export const calendarLocationMaxLength = 500;
export const codeSnippetMaxLength = 50_000;

const allowedTags = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "figure",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "section",
  "span",
  "strong",
  "u",
  "ul",
];

export function sanitizeNoteHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      "*": [
        "class",
        "contenteditable",
        "data-code-snippet",
        "data-code-snippet-id",
        "data-code-snippet-language",
        "data-code-snippet-value",
        "data-upload-image",
        "data-upload-image-id",
        "style",
      ],
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["data", "http", "https"],
    },
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\([0-9,\s.]+\)$/],
        "max-width": [/^\d+(\.\d+)?%$/, /^\d+(\.\d+)?px$/],
        width: [/^\d+(\.\d+)?%$/, /^\d+(\.\d+)?px$/],
        height: [/^auto$/, /^\d+(\.\d+)?px$/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
