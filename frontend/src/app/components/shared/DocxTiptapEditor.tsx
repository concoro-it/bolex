"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Loader2,
    RotateCcw,
    Save,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getApiBaseUrl } from "@/app/lib/apiBase";

type SavedVersion = {
    id: string;
    version_number: number | null;
    document_id: string;
};

interface Props {
    documentId: string;
    versionId?: string | null;
    filename: string;
    onDirtyChange?: (dirty: boolean) => void;
    onSaved?: (version: SavedVersion) => void;
    rounded?: boolean;
    bordered?: boolean;
}

const TextAlign = Extension.create({
    name: "basicTextAlign",
    addGlobalAttributes() {
        return [
            {
                types: ["heading", "paragraph"],
                attributes: {
                    textAlign: {
                        default: "left",
                        parseHTML: (element) =>
                            element.style.textAlign || "left",
                        renderHTML: (attributes) => {
                            if (
                                !attributes.textAlign ||
                                attributes.textAlign === "left"
                            ) {
                                return {};
                            }
                            return {
                                style: `text-align: ${attributes.textAlign}`,
                            };
                        },
                    },
                },
            },
        ];
    },
});

function ToolbarButton({
    active,
    disabled,
    label,
    onClick,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white hover:bg-gray-100"
            }`}
        >
            {children}
        </button>
    );
}

export function DocxTiptapEditor({
    documentId,
    versionId,
    filename,
    onDirtyChange,
    onSaved,
    rounded = true,
    bordered = true,
}: Props) {
    const [baseVersionId, setBaseVersionId] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const extensions = useMemo(() => [StarterKit, TextAlign], []);
    const editor = useEditor({
        extensions,
        content: "<p></p>",
        immediatelyRender: false,
        editable: false,
        editorProps: {
            attributes: {
                class: "docx-tiptap-content",
            },
        },
        onUpdate: () => {
            setDirty(true);
            onDirtyChange?.(true);
            setNotice(null);
        },
    });

    const loadContent = useCallback(async () => {
        if (!editor) return;
        setLoading(true);
        setError(null);
        setNotice(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;
            const apiBase = getApiBaseUrl();
            const qs = versionId
                ? `?version_id=${encodeURIComponent(versionId)}`
                : "";
            const resp = await fetch(
                `${apiBase}/single-documents/${documentId}/editor-content${qs}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(data.detail ?? `HTTP ${resp.status}`);
            }
            setBaseVersionId(data.base_version_id ?? null);
            setPendingCount(data.pending_edit_count ?? 0);
            editor.commands.setContent(data.html || "<p></p>");
            editor.setEditable((data.pending_edit_count ?? 0) === 0);
            setDirty(false);
            onDirtyChange?.(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [documentId, editor, onDirtyChange, versionId]);

    useEffect(() => {
        void loadContent();
    }, [loadContent]);

    const setAlign = (value: "left" | "center" | "right" | "justify") => {
        if (!editor) return;
        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", { textAlign: value })
            .updateAttributes("heading", { textAlign: value })
            .run();
    };

    const handleDiscard = () => {
        void loadContent();
    };

    const handleSave = async () => {
        if (!editor || !baseVersionId || saving || pendingCount > 0) return;
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;
            const apiBase = getApiBaseUrl();
            const resp = await fetch(
                `${apiBase}/single-documents/${documentId}/editor-save`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        base_version_id: baseVersionId,
                        content: editor.getJSON() as JSONContent,
                    }),
                },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(data.detail ?? `HTTP ${resp.status}`);
            }
            setBaseVersionId(data.id ?? null);
            setDirty(false);
            onDirtyChange?.(false);
            setNotice(`Saved ${data.version_number ? `as V${data.version_number}` : "as a new version"}.`);
            onSaved?.({
                id: data.id,
                version_number: data.version_number ?? null,
                document_id: data.document_id ?? documentId,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white ${
                bordered ? "border border-gray-200" : ""
            } ${rounded ? "rounded-xl" : ""}`}
        >
            <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2">
                <div className="mr-2 min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-700">
                        {filename}
                    </p>
                    {pendingCount > 0 ? (
                        <p className="text-[11px] text-amber-700">
                            Resolve pending AI changes before manual editing.
                        </p>
                    ) : (
                        <p className="text-[11px] text-gray-500">
                            Text-focused editing. Save creates a new version.
                        </p>
                    )}
                </div>
                <ToolbarButton
                    label="Bold"
                    active={!!editor?.isActive("bold")}
                    disabled={!editor || pendingCount > 0}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Italic"
                    active={!!editor?.isActive("italic")}
                    disabled={!editor || pendingCount > 0}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Heading 1"
                    active={!!editor?.isActive("heading", { level: 1 })}
                    disabled={!editor || pendingCount > 0}
                    onClick={() =>
                        editor?.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                >
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Heading 2"
                    active={!!editor?.isActive("heading", { level: 2 })}
                    disabled={!editor || pendingCount > 0}
                    onClick={() =>
                        editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Bullet list"
                    active={!!editor?.isActive("bulletList")}
                    disabled={!editor || pendingCount > 0}
                    onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                    }
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Numbered list"
                    active={!!editor?.isActive("orderedList")}
                    disabled={!editor || pendingCount > 0}
                    onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                    }
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Align left"
                    disabled={!editor || pendingCount > 0}
                    onClick={() => setAlign("left")}
                >
                    <AlignLeft className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Align center"
                    disabled={!editor || pendingCount > 0}
                    onClick={() => setAlign("center")}
                >
                    <AlignCenter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Align right"
                    disabled={!editor || pendingCount > 0}
                    onClick={() => setAlign("right")}
                >
                    <AlignRight className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Justify"
                    disabled={!editor || pendingCount > 0}
                    onClick={() => setAlign("justify")}
                >
                    <AlignJustify className="h-4 w-4" />
                </ToolbarButton>
                <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={loading || saving || !dirty}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Discard
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || saving || !dirty || pendingCount > 0}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-900 bg-gray-900 px-2 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Save className="h-3.5 w-3.5" />
                    )}
                    Save
                </button>
            </div>
            {(error || notice) && (
                <div
                    className={`shrink-0 border-b px-3 py-2 text-xs ${
                        error
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                >
                    {error ?? notice}
                </div>
            )}
            <div className="min-h-0 flex-1 overflow-auto bg-gray-100 px-5 py-5">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <div className="mx-auto min-h-full max-w-[816px] bg-white px-14 py-12 shadow-sm">
                        <EditorContent editor={editor} />
                    </div>
                )}
            </div>
        </div>
    );
}
