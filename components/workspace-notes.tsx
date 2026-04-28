"use client";

import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  ImageIcon,
  Italic,
  Star,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LandingProfileMenu } from "@/components/landing-profile-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Breadcrumbs } from "@/components/workspace/breadcrumbs";
import { CommandPalette } from "@/components/workspace/command-palette";
import {
  EmojiPicker,
  parseIconValue,
  serializeIconValue,
} from "@/components/workspace/emoji-picker";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import {
  type CodeSnippetLanguage,
  type CodeSnippetResponse,
  codeSnippetLanguages,
} from "@/lib/code-snippets";
import {
  escapeHtml,
  noteContentMaxLength,
  sanitizeNoteHtml,
} from "@/lib/content-safety";
import type {
  NoteFolderRecord,
  NoteFolderResponse,
  NoteRecord,
  NoteResponse,
  NotesListResponse,
} from "@/lib/notes-contracts";

type WorkspaceNotesProps = {
  profileLabel: string;
  profileImage: string | null;
};

type TextFormat = "bold" | "italic";
type BlockFormat = "h1" | "h2" | "p";
type ImageResizeHandle = "nw" | "ne" | "sw" | "se";

export function WorkspaceNotes({
  profileLabel,
  profileImage,
}: WorkspaceNotesProps) {
  const minSidebarWidth = 220;
  const maxSidebarWidth = 400;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [folders, setFolders] = useState<NoteFolderRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBlockFormat, setActiveBlockFormat] = useState<BlockFormat>("p");
  const [activeTextFormats, setActiveTextFormats] = useState<TextFormat[]>([]);
  const [isCodeSnippetBoxOpen, setIsCodeSnippetBoxOpen] = useState(false);
  const [codeSnippetValue, setCodeSnippetValue] = useState("");
  const [codeSnippetLanguage, setCodeSnippetLanguage] =
    useState<CodeSnippetLanguage>("typescript");
  const [isInsertingCodeSnippet, setIsInsertingCodeSnippet] = useState(false);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [hoveredSnippetId, setHoveredSnippetId] = useState<string | null>(null);
  const [hoveredSnippetPosition, setHoveredSnippetPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedImageBounds, setSelectedImageBounds] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const activeFolderIdRef = useRef<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const imageResizeStateRef = useRef<{
    imageId: string;
    handle: ImageResizeHandle;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    editorWidth: number;
    aspectRatio: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    startX: number;
    startWidth: number;
  } | null>(null);

  const activeNote = useMemo(
    () => notes.find((item) => item.id === activeNoteId) ?? null,
    [activeNoteId, notes],
  );

  useEffect(() => {
    activeFolderIdRef.current = activeFolderId;
  }, [activeFolderId]);

  const createNote = useCallback(
    async (options?: { folderId?: string | null; silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const folderId = options?.folderId ?? activeFolderIdRef.current;
      if (!silent) {
        setIsCreating(true);
      }
      setError(null);

      const response = await fetch("/api/notes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId,
          title: "Untitled",
          content: "",
        }),
      });

      if (!response.ok) {
        setError("Unable to create note.");
        if (!silent) {
          setIsCreating(false);
        }
        return null;
      }

      const data = (await response.json()) as NoteResponse;
      setNotes((current) => [data.note, ...current]);
      setActiveNoteId(data.note.id);
      setActiveFolderId(data.note.folderId ?? null);

      if (data.note.folderId) {
        setExpandedFolderIds((current) =>
          current.includes(data.note.folderId as string)
            ? current
            : [...current, data.note.folderId as string],
        );
      }

      if (!silent) {
        setIsCreating(false);
      }

      return data.note;
    },
    [],
  );

  const createFolder = useCallback(async () => {
    setError(null);
    setIsCreatingFolder(true);

    const response = await fetch("/api/folders", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Folder ${folders.length + 1}`,
      }),
    });

    if (!response.ok) {
      setError("Unable to create folder.");
      setIsCreatingFolder(false);
      return null;
    }

    const data = (await response.json()) as NoteFolderResponse;
    setFolders((current) => [...current, data.folder]);
    setActiveFolderId(data.folder.id);
    setExpandedFolderIds((current) => [...current, data.folder.id]);
    setIsCreatingFolder(false);
    return data.folder;
  }, [folders.length]);

  const renameFolder = useCallback(
    async (folderId: string, nextName: string) => {
      setError(null);

      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nextName,
        }),
      });

      if (!response.ok) {
        setError("Unable to rename folder.");
        return;
      }

      const data = (await response.json()) as NoteFolderResponse;
      setFolders((current) =>
        current.map((folder) =>
          folder.id === folderId ? data.folder : folder,
        ),
      );
    },
    [],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      setError(null);
      setDeletingFolderId(folderId);

      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        setError("Unable to delete folder.");
        setDeletingFolderId(null);
        return;
      }

      setFolders((current) =>
        current.filter((folder) => folder.id !== folderId),
      );
      setExpandedFolderIds((current) =>
        current.filter((expandedId) => expandedId !== folderId),
      );
      setNotes((current) =>
        current.map((item) =>
          item.folderId === folderId ? { ...item, folderId: null } : item,
        ),
      );

      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }

      setDeletingFolderId(null);
    },
    [activeFolderId],
  );

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/notes", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setError("Unable to load notes.");
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as NotesListResponse;
      setFolders(data.folders);
      setNotes(data.notes);

      if (data.notes.length > 0) {
        const noteId = new URLSearchParams(window.location.search).get(
          "noteId",
        );
        const initialNote =
          data.notes.find((note) => note.id === noteId) ?? data.notes[0];
        setActiveNoteId(initialNote.id);
        setActiveFolderId(initialNote.folderId ?? null);
        setExpandedFolderIds(data.folders.map((folder) => folder.id));
      } else {
        await createNote({ silent: true });
      }

      setIsLoading(false);
    })();
  }, [createNote]);

  useEffect(() => {
    if (!activeNote) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetch(`/api/notes/${activeNote.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: activeNote.title,
          content: activeNote.content,
        }),
      });
    }, 700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeNote]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const nextContent = activeNote?.content ?? "";

    const safeContent = sanitizeNoteHtml(nextContent);

    if (editorRef.current.innerHTML !== safeContent) {
      editorRef.current.innerHTML = safeContent;
    }
  }, [activeNote?.content]);

  useEffect(() => {
    if (!activeNote) {
      setSelectedImageId(null);
      setSelectedImageBounds(null);
      return;
    }

    setSelectedImageId(null);
    setSelectedImageBounds(null);
  }, [activeNote]);

  const updateActiveNote = useCallback(
    (input: Partial<Pick<NoteRecord, "title" | "content">>) => {
      if (!activeNoteId) {
        return;
      }

      const nextInput =
        typeof input.content === "string"
          ? {
              ...input,
              content: sanitizeNoteHtml(
                input.content.slice(0, noteContentMaxLength),
              ),
            }
          : input;

      setNotes((current) =>
        current.map((item) =>
          item.id === activeNoteId
            ? {
                ...item,
                ...nextInput,
              }
            : item,
        ),
      );
    },
    [activeNoteId],
  );

  const patchNote = useCallback(
    async (
      noteId: string,
      input: Partial<
        Pick<NoteRecord, "icon" | "isFavorite" | "isArchived" | "folderId">
      >,
    ) => {
      setNotes((current) =>
        current.map((item) =>
          item.id === noteId ? { ...item, ...input } : item,
        ),
      );

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        setError("Unable to update note.");
      }
    },
    [],
  );

  const toggleFavorite = useCallback(
    (noteId: string, next: boolean) => {
      void patchNote(noteId, { isFavorite: next });
    },
    [patchNote],
  );

  const setActiveNoteIcon = useCallback(
    (icon: { type: "emoji"; value: string } | null) => {
      if (!activeNoteId) return;
      void patchNote(activeNoteId, { icon: serializeIconValue(icon) });
    },
    [activeNoteId, patchNote],
  );

  const deleteNote = async (noteId: string) => {
    setError(null);
    setDeletingNoteId(noteId);

    const response = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      setError("Unable to delete note.");
      setDeletingNoteId(null);
      return;
    }

    setNotes((current) => {
      const filtered = current.filter((item) => item.id !== noteId);

      if (activeNoteId === noteId) {
        const nextNote = filtered[0] ?? null;
        setActiveNoteId(nextNote?.id ?? null);
        setActiveFolderId(nextNote?.folderId ?? null);
      }

      return filtered;
    });

    setDeletingNoteId(null);
  };

  const refreshEditorFormats = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }

    const block = document.queryCommandValue("formatBlock").toLowerCase();

    if (block === "h1") {
      setActiveBlockFormat("h1");
    } else if (block === "h2") {
      setActiveBlockFormat("h2");
    } else {
      setActiveBlockFormat("p");
    }

    setActiveTextFormats([
      ...(document.queryCommandState("bold") ? (["bold"] as const) : []),
      ...(document.queryCommandState("italic") ? (["italic"] as const) : []),
    ]);
  }, []);

  const saveEditorSelection = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    selectionRangeRef.current = range.cloneRange();
  }, []);

  const restoreEditorSelection = useCallback(() => {
    const selection = window.getSelection();
    const range = selectionRangeRef.current;

    if (!selection || !range) {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }, []);

  const insertMarkupIntoEditor = useCallback(
    (markup: string) => {
      const editorElement = editorRef.current;
      const safeMarkup = sanitizeNoteHtml(markup);

      if (!editorElement) {
        return false;
      }

      editorElement.focus();
      const restoredSelection = restoreEditorSelection();

      if (restoredSelection) {
        document.execCommand("insertHTML", false, safeMarkup);
        saveEditorSelection();
        return true;
      }

      editorElement.innerHTML = sanitizeNoteHtml(
        `${editorElement.innerHTML}${safeMarkup}`,
      );
      return true;
    },
    [restoreEditorSelection, saveEditorSelection],
  );

  useEffect(() => {
    const onSelectionChange = () => {
      saveEditorSelection();
      refreshEditorFormats();
    };

    document.addEventListener("selectionchange", onSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [refreshEditorFormats, saveEditorSelection]);

  const applyBlockFormat = (format: BlockFormat) => {
    editorRef.current?.focus();
    restoreEditorSelection();
    document.execCommand("formatBlock", false, format);
    saveEditorSelection();
    refreshEditorFormats();
    updateActiveNote({ content: editorRef.current?.innerHTML ?? "" });
  };

  const applyTextFormat = (format: TextFormat) => {
    editorRef.current?.focus();
    restoreEditorSelection();
    document.execCommand(format, false);
    saveEditorSelection();
    refreshEditorFormats();
    updateActiveNote({ content: editorRef.current?.innerHTML ?? "" });
  };

  const insertEditorIndent = () => {
    editorRef.current?.focus();
    restoreEditorSelection();
    document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    saveEditorSelection();
    updateActiveNote({ content: editorRef.current?.innerHTML ?? "" });
  };

  const pastePlainTextIntoField = useCallback(
    (
      event: React.ClipboardEvent<HTMLTextAreaElement>,
      onChange: (nextValue: string) => void,
    ) => {
      event.preventDefault();

      const pastedText = event.clipboardData.getData("text/plain");
      const target = event.currentTarget;
      const selectionStart = target.selectionStart ?? target.value.length;
      const selectionEnd = target.selectionEnd ?? target.value.length;
      const nextValue =
        target.value.slice(0, selectionStart) +
        pastedText +
        target.value.slice(selectionEnd);

      onChange(nextValue);

      requestAnimationFrame(() => {
        const cursorPosition = selectionStart + pastedText.length;
        target.selectionStart = cursorPosition;
        target.selectionEnd = cursorPosition;
      });
    },
    [],
  );

  const clearSelectedImage = useCallback(() => {
    setSelectedImageId(null);
    setSelectedImageBounds(null);
  }, []);

  const updateSelectedImageBounds = useCallback((imageId: string) => {
    const editorElement = editorRef.current;

    if (!editorElement) {
      return false;
    }

    const imageElement = editorElement.querySelector<HTMLImageElement>(
      `img[data-upload-image-id="${imageId}"]`,
    );

    if (!imageElement) {
      return false;
    }

    const editorBounds = editorElement.getBoundingClientRect();
    const imageBounds = imageElement.getBoundingClientRect();

    setSelectedImageBounds({
      top: imageBounds.top - editorBounds.top,
      left: imageBounds.left - editorBounds.left,
      width: imageBounds.width,
      height: imageBounds.height,
    });

    return true;
  }, []);

  const selectEditorImage = useCallback(
    (imageElement: HTMLImageElement) => {
      let imageId = imageElement.dataset.uploadImageId;

      if (!imageId) {
        imageId = crypto.randomUUID();
        imageElement.dataset.uploadImageId = imageId;
      }

      imageElement.dataset.uploadImage = "true";
      setSelectedImageId(imageId);
      updateSelectedImageBounds(imageId);
    },
    [updateSelectedImageBounds],
  );

  const startImageResize = useCallback(
    (handle: ImageResizeHandle, event: React.MouseEvent<HTMLButtonElement>) => {
      if (!selectedImageId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const editorElement = editorRef.current;

      if (!editorElement) {
        return;
      }

      const imageElement = editorElement.querySelector<HTMLImageElement>(
        `img[data-upload-image-id="${selectedImageId}"]`,
      );

      if (!imageElement) {
        clearSelectedImage();
        return;
      }

      const imageBounds = imageElement.getBoundingClientRect();
      const safeHeight = imageBounds.height || 1;

      imageResizeStateRef.current = {
        imageId: selectedImageId,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: imageBounds.width,
        startHeight: safeHeight,
        editorWidth: editorElement.clientWidth || 1,
        aspectRatio: imageBounds.width / safeHeight,
      };
    },
    [clearSelectedImage, selectedImageId],
  );

  const deleteSelectedImage = useCallback(() => {
    if (!selectedImageId) {
      return;
    }

    const editorElement = editorRef.current;

    if (!editorElement) {
      return;
    }

    const imageElement = editorElement.querySelector<HTMLImageElement>(
      `img[data-upload-image-id="${selectedImageId}"]`,
    );

    if (!imageElement) {
      clearSelectedImage();
      return;
    }

    const paragraphElement = imageElement.closest("p");
    imageElement.remove();

    if (
      paragraphElement &&
      paragraphElement.querySelector("img") === null &&
      paragraphElement.textContent?.trim() === ""
    ) {
      paragraphElement.remove();
    }

    updateActiveNote({ content: editorElement.innerHTML });
    clearSelectedImage();
  }, [clearSelectedImage, selectedImageId, updateActiveNote]);

  useEffect(() => {
    if (!selectedImageId) {
      return;
    }

    const syncPosition = () => {
      const hasImage = updateSelectedImageBounds(selectedImageId);

      if (!hasImage) {
        clearSelectedImage();
      }
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);

    return () => {
      window.removeEventListener("resize", syncPosition);
    };
  }, [clearSelectedImage, selectedImageId, updateSelectedImageBounds]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const resizeState = imageResizeStateRef.current;

      if (!resizeState) {
        return;
      }

      const editorElement = editorRef.current;

      if (!editorElement) {
        return;
      }

      const imageElement = editorElement.querySelector<HTMLImageElement>(
        `img[data-upload-image-id="${resizeState.imageId}"]`,
      );

      if (!imageElement) {
        clearSelectedImage();
        imageResizeStateRef.current = null;
        return;
      }

      const directionX = resizeState.handle.includes("w") ? -1 : 1;
      const pointerDeltaX = event.clientX - resizeState.startX;
      const widthDelta = pointerDeltaX * directionX;
      const minWidth = 120;
      const maxWidth = resizeState.editorWidth;
      const nextWidth = Math.max(
        minWidth,
        Math.min(maxWidth, resizeState.startWidth + widthDelta),
      );
      const nextPercent = (nextWidth / resizeState.editorWidth) * 100;
      const clampedPercent = Math.max(10, Math.min(100, nextPercent));

      imageElement.style.width = `${clampedPercent}%`;
      imageElement.style.maxWidth = "100%";
      imageElement.style.height = "auto";

      void updateSelectedImageBounds(resizeState.imageId);
    };

    const onMouseUp = () => {
      const resizeState = imageResizeStateRef.current;

      if (!resizeState) {
        return;
      }

      imageResizeStateRef.current = null;

      const editorElement = editorRef.current;

      if (!editorElement) {
        return;
      }

      updateActiveNote({ content: editorElement.innerHTML });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [clearSelectedImage, updateActiveNote, updateSelectedImageBounds]);

  const insertImageFile = useCallback(
    async (file: File) => {
      if (!activeNote) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Only image files can be uploaded.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be smaller than 10MB.");
        return;
      }

      setError(null);
      setIsInsertingImage(true);

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
              return;
            }

            reject(new Error("Invalid image data."));
          };

          reader.onerror = () => reject(new Error("Unable to read image."));
          reader.readAsDataURL(file);
        });

        const imageId = crypto.randomUUID();
        const altText =
          file.name.replace(/[<>"'&]/g, "").trim() || "Uploaded image";
        const inserted = insertMarkupIntoEditor(
          `<p><img data-upload-image="true" data-upload-image-id="${imageId}" src="${dataUrl}" alt="${altText}" /></p><p><br></p>`,
        );
        const editorElement = editorRef.current;

        if (!inserted || !editorElement) {
          setError("Unable to insert image.");
          return;
        }

        saveEditorSelection();
        updateActiveNote({ content: editorElement.innerHTML });
        setSelectedImageId(imageId);
        requestAnimationFrame(() => {
          void updateSelectedImageBounds(imageId);
        });
      } catch {
        setError("Unable to upload image.");
      } finally {
        setIsInsertingImage(false);
      }
    },
    [
      activeNote,
      insertMarkupIntoEditor,
      saveEditorSelection,
      updateActiveNote,
      updateSelectedImageBounds,
    ],
  );

  const onImageInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      void insertImageFile(file);
    },
    [insertImageFile],
  );

  const insertCodeSnippet = useCallback(async () => {
    const code = codeSnippetValue.trimEnd();

    if (!code || !activeNote) {
      return;
    }

    setError(null);
    setIsInsertingCodeSnippet(true);

    const response = await fetch("/api/highlight", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        language: codeSnippetLanguage,
        snippetId: editingSnippetId,
      }),
    });

    if (!response.ok) {
      setError("Unable to insert code snippet.");
      setIsInsertingCodeSnippet(false);
      return;
    }

    const data = (await response.json()) as CodeSnippetResponse;

    const editorElement = editorRef.current;

    if (!editorElement) {
      setIsInsertingCodeSnippet(false);
      return;
    }

    if (editingSnippetId) {
      const activeSnippet = editorElement.querySelector<HTMLElement>(
        `[data-code-snippet-id="${editingSnippetId}"]`,
      );

      if (activeSnippet) {
        activeSnippet.outerHTML = data.markup;
      }
    } else {
      insertMarkupIntoEditor(data.markup);
    }

    saveEditorSelection();
    updateActiveNote({ content: editorElement.innerHTML });
    setCodeSnippetValue("");
    setEditingSnippetId(null);
    setIsCodeSnippetBoxOpen(false);
    setIsInsertingCodeSnippet(false);
  }, [
    activeNote,
    codeSnippetLanguage,
    codeSnippetValue,
    editingSnippetId,
    insertMarkupIntoEditor,
    saveEditorSelection,
    updateActiveNote,
  ]);

  const deleteSnippet = useCallback(
    (snippetId: string) => {
      const editorElement = editorRef.current;

      if (!editorElement) {
        return;
      }

      const snippetElement = editorElement.querySelector<HTMLElement>(
        `[data-code-snippet-id="${snippetId}"]`,
      );

      if (!snippetElement) {
        return;
      }

      snippetElement.remove();
      setHoveredSnippetId(null);
      setHoveredSnippetPosition(null);
      updateActiveNote({
        content: editorElement.innerHTML,
      });
    },
    [updateActiveNote],
  );

  const editSnippet = useCallback((snippetId: string) => {
    const editorElement = editorRef.current;

    if (!editorElement) {
      return;
    }

    const snippetElement = editorElement.querySelector<HTMLElement>(
      `[data-code-snippet-id="${snippetId}"]`,
    );

    if (!snippetElement) {
      return;
    }

    const encodedValue = snippetElement.dataset.codeSnippetValue ?? "";
    const snippetLanguage = snippetElement.dataset.codeSnippetLanguage;

    if (!snippetLanguage) {
      return;
    }

    setCodeSnippetValue(decodeURIComponent(encodedValue));
    setCodeSnippetLanguage(snippetLanguage as CodeSnippetLanguage);
    setEditingSnippetId(snippetId);
    setIsCodeSnippetBoxOpen(true);
  }, []);

  const hasEditorContent = Boolean(
    activeNote?.content.replace(/<[^>]+>/g, "").trim(),
  );

  const onSidebarResizeStart = (clientX: number) => {
    resizeStateRef.current = {
      startX: clientX,
      startWidth: sidebarWidth,
    };
  };

  const onToggleSidebar = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  const onToggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) =>
      current.includes(folderId)
        ? current.filter((item) => item !== folderId)
        : [...current, folderId],
    );
  };

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current || isSidebarCollapsed) {
        return;
      }

      const nextWidth =
        resizeStateRef.current.startWidth +
        (event.clientX - resizeStateRef.current.startX);

      if (nextWidth < minSidebarWidth) {
        setSidebarWidth(minSidebarWidth);
        return;
      }

      if (nextWidth > maxSidebarWidth) {
        setSidebarWidth(maxSidebarWidth);
        return;
      }

      setSidebarWidth(nextWidth);
    };

    const onMouseUp = () => {
      resizeStateRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isSidebarCollapsed]);

  const activeIcon = useMemo(
    () => parseIconValue(activeNote?.icon ?? null),
    [activeNote?.icon],
  );

  return (
    <div className="flex h-screen w-full bg-background">
      {!isSidebarCollapsed ? (
        <WorkspaceSidebar
          profileLabel={profileLabel}
          profileImage={profileImage}
          width={sidebarWidth}
          onCollapse={onToggleSidebar}
          onResizeStart={(event) => onSidebarResizeStart(event.clientX)}
          onOpenCommandPalette={() => setIsCommandOpen(true)}
          activeNoteId={activeNoteId}
          activeFolderId={activeFolderId}
          expandedFolderIds={expandedFolderIds}
          folders={folders}
          notes={notes}
          deletingFolderId={deletingFolderId}
          deletingNoteId={deletingNoteId}
          isCreating={isCreating}
          isCreatingFolder={isCreatingFolder}
          onCreateNote={(folderId) =>
            void createNote({ folderId, silent: false })
          }
          onCreateFolder={() => void createFolder()}
          onDeleteFolder={(folderId) => void deleteFolder(folderId)}
          onDeleteNote={(noteId) => void deleteNote(noteId)}
          onRenameFolder={(folderId, nextName) =>
            void renameFolder(folderId, nextName)
          }
          onSelectFolder={setActiveFolderId}
          onSelectNote={(noteId, folderId) => {
            setActiveNoteId(noteId);
            setActiveFolderId(folderId);
          }}
          onToggleFolder={onToggleFolder}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}

      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        notes={notes}
        onSelectNote={(noteId, folderId) => {
          setActiveNoteId(noteId);
          setActiveFolderId(folderId);
        }}
        onCreateNote={() => void createNote({ folderId: null, silent: false })}
        onCreateFolder={() => void createFolder()}
      />

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-11 items-center gap-2 border-b border-border px-3">
          {isSidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                aria-label="Open sidebar"
                onClick={onToggleSidebar}
                className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <span className="flex flex-col gap-1">
                  <span className="h-px w-3 bg-current" />
                  <span className="h-px w-3 bg-current" />
                  <span className="h-px w-3 bg-current" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open sidebar</TooltipContent>
            </Tooltip>
          ) : null}
          <Breadcrumbs
            note={activeNote}
            folders={folders}
            onSelectFolder={setActiveFolderId}
          />
          <div className="ml-auto flex items-center gap-1">
            {activeNote ? (
              <Tooltip>
                <TooltipTrigger
                  aria-label={
                    activeNote.isFavorite ? "Unfavorite" : "Add to favorites"
                  }
                  onClick={() =>
                    toggleFavorite(activeNote.id, !activeNote.isFavorite)
                  }
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <Star
                    className={`size-4 ${activeNote.isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {activeNote.isFavorite ? "Unfavorite" : "Add to favorites"}
                </TooltipContent>
              </Tooltip>
            ) : null}
            <LandingProfileMenu
              profileLabel={profileLabel}
              image={profileImage}
            />
          </div>
        </header>

        <article className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-10">
          {error ? (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          ) : null}

          {isLoading ? (
            <section className="space-y-5 pt-10" aria-label="Loading notes">
              <div className="h-10 w-20 rounded-md bg-muted" />
              <div className="h-12 w-3/4 rounded-md bg-muted" />
              <div className="space-y-3">
                <div className="h-5 w-full rounded bg-muted" />
                <div className="h-5 w-11/12 rounded bg-muted" />
                <div className="h-5 w-2/3 rounded bg-muted" />
              </div>
            </section>
          ) : null}

          {activeNote ? (
            <div className="mb-2">
              <EmojiPicker
                value={activeIcon}
                onChange={setActiveNoteIcon}
                size="lg"
              />
            </div>
          ) : null}

          <input
            aria-label="Note title"
            placeholder="Untitled"
            value={activeNote?.title ?? ""}
            onChange={(event) =>
              updateActiveNote({ title: event.target.value })
            }
            disabled={!activeNote}
            className="mb-6 w-full bg-transparent font-sans text-[40px] font-bold leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
          />

          {activeNote ? (
            <div className="sticky top-0 z-10 mb-8 flex flex-wrap items-center gap-1 border-y border-border bg-background/95 py-2 backdrop-blur">
              <EditorToolbarButton
                label="Paragraph"
                active={activeBlockFormat === "p"}
                onClick={() => applyBlockFormat("p")}
              >
                <span className="text-xs font-semibold">P</span>
              </EditorToolbarButton>
              <EditorToolbarButton
                label="Heading 1"
                active={activeBlockFormat === "h1"}
                onClick={() => applyBlockFormat("h1")}
              >
                <Heading1 className="size-4" />
              </EditorToolbarButton>
              <EditorToolbarButton
                label="Heading 2"
                active={activeBlockFormat === "h2"}
                onClick={() => applyBlockFormat("h2")}
              >
                <Heading2 className="size-4" />
              </EditorToolbarButton>
              <span className="mx-1 h-5 w-px bg-border" />
              <EditorToolbarButton
                label="Bold"
                active={activeTextFormats.includes("bold")}
                onClick={() => applyTextFormat("bold")}
              >
                <Bold className="size-4" />
              </EditorToolbarButton>
              <EditorToolbarButton
                label="Italic"
                active={activeTextFormats.includes("italic")}
                onClick={() => applyTextFormat("italic")}
              >
                <Italic className="size-4" />
              </EditorToolbarButton>
              <span className="mx-1 h-5 w-px bg-border" />
              <EditorToolbarButton
                label="Insert code snippet"
                active={isCodeSnippetBoxOpen}
                onClick={() => {
                  saveEditorSelection();
                  setEditingSnippetId(null);
                  setCodeSnippetValue("");
                  setIsCodeSnippetBoxOpen(true);
                }}
              >
                <Code2 className="size-4" />
              </EditorToolbarButton>
              <EditorToolbarButton
                label={isInsertingImage ? "Inserting image" : "Insert image"}
                active={isInsertingImage}
                onClick={() => {
                  saveEditorSelection();
                  imageInputRef.current?.click();
                }}
              >
                <ImageIcon className="size-4" />
              </EditorToolbarButton>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageInputChange}
              />
            </div>
          ) : null}

          <section
            className="relative min-h-[62vh]"
            aria-label="Note editor"
            onMouseLeave={() => {
              setHoveredSnippetId(null);
              setHoveredSnippetPosition(null);
            }}
            onMouseMove={(event) => {
              const target = event.target;

              if (!(target instanceof HTMLElement) || !editorRef.current) {
                return;
              }

              const overlayElement = target.closest<HTMLElement>(
                "[data-code-snippet-overlay='true']",
              );

              if (overlayElement && hoveredSnippetId) {
                return;
              }

              const snippetElement = target.closest<HTMLElement>(
                "[data-code-snippet='true']",
              );

              if (!snippetElement) {
                if (hoveredSnippetId) {
                  setHoveredSnippetId(null);
                  setHoveredSnippetPosition(null);
                }
                return;
              }

              const snippetId = snippetElement.dataset.codeSnippetId;

              if (!snippetId) {
                return;
              }

              const editorBounds = editorRef.current.getBoundingClientRect();
              const snippetBounds = snippetElement.getBoundingClientRect();
              const nextTop = snippetBounds.top - editorBounds.top + 8;
              const nextLeft = snippetBounds.right - editorBounds.left - 8;

              if (
                hoveredSnippetId !== snippetId ||
                hoveredSnippetPosition?.top !== nextTop ||
                hoveredSnippetPosition?.left !== nextLeft
              ) {
                setHoveredSnippetId(snippetId);
                setHoveredSnippetPosition({
                  top: nextTop,
                  left: nextLeft,
                });
              }
            }}
          >
            {hoveredSnippetId && hoveredSnippetPosition ? (
              <div
                data-code-snippet-overlay="true"
                className="absolute z-20 flex items-center gap-2"
                style={{
                  left: hoveredSnippetPosition.left,
                  top: hoveredSnippetPosition.top,
                  transform: "translateX(-100%)",
                }}
              >
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editSnippet(hoveredSnippetId)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs text-foreground transition hover:bg-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => deleteSnippet(hoveredSnippetId)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs text-destructive transition hover:bg-destructive/10"
                >
                  Del
                </button>
              </div>
            ) : null}
            {selectedImageId && selectedImageBounds ? (
              <>
                <div
                  data-image-overlay="true"
                  className="pointer-events-none absolute z-20 rounded-md border border-foreground/60"
                  style={{
                    left: selectedImageBounds.left,
                    top: selectedImageBounds.top,
                    width: selectedImageBounds.width,
                    height: selectedImageBounds.height,
                  }}
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={deleteSelectedImage}
                  className="absolute z-30 rounded-lg border border-border bg-background px-2 py-1 text-xs text-destructive transition hover:bg-destructive/10"
                  style={{
                    left: selectedImageBounds.left + selectedImageBounds.width,
                    top: selectedImageBounds.top - 10,
                    transform: "translate(-100%, -100%)",
                  }}
                >
                  Del
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => startImageResize("nw", event)}
                  className="absolute z-30 h-3 w-3 cursor-nwse-resize rounded-full border border-foreground/70 bg-background"
                  style={{
                    left: selectedImageBounds.left,
                    top: selectedImageBounds.top,
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-label="Resize image from top left"
                />
                <button
                  type="button"
                  onMouseDown={(event) => startImageResize("ne", event)}
                  className="absolute z-30 h-3 w-3 cursor-nesw-resize rounded-full border border-foreground/70 bg-background"
                  style={{
                    left: selectedImageBounds.left + selectedImageBounds.width,
                    top: selectedImageBounds.top,
                    transform: "translate(50%, -50%)",
                  }}
                  aria-label="Resize image from top right"
                />
                <button
                  type="button"
                  onMouseDown={(event) => startImageResize("sw", event)}
                  className="absolute z-30 h-3 w-3 cursor-nesw-resize rounded-full border border-foreground/70 bg-background"
                  style={{
                    left: selectedImageBounds.left,
                    top: selectedImageBounds.top + selectedImageBounds.height,
                    transform: "translate(-50%, 50%)",
                  }}
                  aria-label="Resize image from bottom left"
                />
                <button
                  type="button"
                  onMouseDown={(event) => startImageResize("se", event)}
                  className="absolute z-30 h-3 w-3 cursor-nwse-resize rounded-full border border-foreground/70 bg-background"
                  style={{
                    left: selectedImageBounds.left + selectedImageBounds.width,
                    top: selectedImageBounds.top + selectedImageBounds.height,
                    transform: "translate(50%, 50%)",
                  }}
                  aria-label="Resize image from bottom right"
                />
              </>
            ) : null}
            {!hasEditorContent ? (
              <p className="pointer-events-none absolute left-0 top-0 text-[22px] leading-[1.35] text-muted-foreground">
                Start typing your notes...
              </p>
            ) : null}
            <article
              ref={editorRef}
              contentEditable={Boolean(activeNote)}
              suppressContentEditableWarning
              onKeyDown={(event) => {
                if (event.key === "Tab") {
                  event.preventDefault();
                  insertEditorIndent();
                }
              }}
              onInput={(event) =>
                updateActiveNote({
                  content: event.currentTarget.innerHTML,
                })
              }
              onClick={(event) => {
                const imageElement =
                  event.target instanceof HTMLImageElement
                    ? event.target
                    : null;

                if (!imageElement) {
                  clearSelectedImage();
                  return;
                }

                selectEditorImage(imageElement);
              }}
              onPaste={(event) => {
                const imageFile = Array.from(event.clipboardData.files).find(
                  (file) => file.type.startsWith("image/"),
                );

                if (imageFile) {
                  event.preventDefault();
                  void insertImageFile(imageFile);
                  return;
                }

                const html = event.clipboardData.getData("text/html");
                const text = event.clipboardData.getData("text/plain");

                if (!html && !text) {
                  return;
                }

                event.preventDefault();
                const markup = html
                  ? sanitizeNoteHtml(html)
                  : `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;

                if (insertMarkupIntoEditor(markup) && editorRef.current) {
                  updateActiveNote({ content: editorRef.current.innerHTML });
                }
              }}
              onBlur={() => {
                refreshEditorFormats();
              }}
              className="min-h-[62vh] w-full bg-transparent text-[22px] leading-[1.35] text-foreground outline-none disabled:opacity-50 [&_figure[data-code-snippet='true']_.shiki]:bg-transparent! [&_figure[data-code-snippet='true']_.shiki]:p-0 [&_figure[data-code-snippet='true']_code]:grid [&_figure[data-code-snippet='true']_code]:gap-0 [&_figure[data-code-snippet='true']_code]:font-mono [&_figure[data-code-snippet='true']_code]:text-[15px] [&_figure[data-code-snippet='true']_code]:leading-7 [&_figure[data-code-snippet='true']_pre]:overflow-x-auto [&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-3xl [&_h2]:font-semibold [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:cursor-pointer [&_p]:mb-2 [&_strong]:font-semibold [&_em]:italic"
            ></article>
          </section>
        </article>
      </section>

      {isCodeSnippetBoxOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <section className="w-full max-w-2xl rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">
                  {editingSnippetId
                    ? "Edit code snippet"
                    : "Insert code snippet"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a language and paste the code block.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCodeSnippetBoxOpen(false);
                  setEditingSnippetId(null);
                  setCodeSnippetValue("");
                }}
                className="rounded-md border border-border px-2 py-1 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Language</span>
                <select
                  value={codeSnippetLanguage}
                  onChange={(event) =>
                    setCodeSnippetLanguage(
                      event.target.value as CodeSnippetLanguage,
                    )
                  }
                  className="h-9 rounded-md border border-border bg-background px-3 text-foreground outline-none focus:border-ring"
                >
                  {codeSnippetLanguages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted-foreground">Code</span>
                <textarea
                  value={codeSnippetValue}
                  onChange={(event) => setCodeSnippetValue(event.target.value)}
                  onPaste={(event) =>
                    pastePlainTextIntoField(event, setCodeSnippetValue)
                  }
                  className="min-h-72 resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm leading-6 text-foreground outline-none focus:border-ring"
                  spellCheck={false}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCodeSnippetBoxOpen(false);
                  setEditingSnippetId(null);
                  setCodeSnippetValue("");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isInsertingCodeSnippet || !codeSnippetValue.trim()}
                onClick={() => {
                  void insertCodeSnippet();
                }}
                className="rounded-md border border-border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isInsertingCodeSnippet ? "Saving..." : "Insert"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function EditorToolbarButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={label}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        className={`grid size-8 place-items-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-foreground ${
          active
            ? "border-ring bg-accent text-foreground"
            : "border-transparent"
        }`}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
