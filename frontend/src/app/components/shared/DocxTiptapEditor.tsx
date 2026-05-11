"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    Heading3,
    Italic,
    List,
    ListOrdered,
    Loader2,
    Minus,
    Quote,
    Save,
    History,
    RotateCcw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getApiBaseUrl } from "@/app/lib/apiBase";
import {
    listDocumentVersions,
    restoreDocumentVersion,
    type MikeDocumentVersion,
} from "@/app/lib/mikeApi";

type SavedVersion = {
    id: string;
    version_number: number | null;
    document_id: string;
};

const EDITOR_FETCH_TIMEOUT_MS = 45_000;
const HISTORY_GROUP_SIZE = 10;

interface Props {
    documentId: string;
    versionId?: string | null;
    filename: string;
    onDirtyChange?: (dirty: boolean) => void;
    onSaved?: (version: SavedVersion) => void;
    rounded?: boolean;
    bordered?: boolean;
    autoSave?: boolean;
    autoSaveDelayMs?: number;
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

function formatRelativeTime(date: Date | null): string {
    if (!date) return "Henüz kaydedilmedi.";
    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffSeconds < 5) return "Az önce kaydedildi.";
    if (diffSeconds < 60) return `${diffSeconds} saniye önce kaydedildi.`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} dakika önce kaydedildi.`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} saat önce kaydedildi.`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce kaydedildi.`;
}

function historySourceLabel(source: string): string {
    if (source === "generated") return "Doküman oluşturuldu";
    if (source === "assistant_edit") return "AI düzenlemesi";
    if (source === "manual_edit") return "Editor kaydı";
    if (source === "user_upload") return "Yeni dosya yüklendi";
    if (source === "upload") return "İlk yükleme";
    return "Değişiklik";
}

function historyGroupLabel(sources: Set<string>): string {
    if (sources.size === 1) {
        return historySourceLabel([...sources][0]);
    }
    if (sources.has("assistant_edit")) return "AI ve editor kayıtları";
    return "Aktivite paketi";
}

function groupHistory(versions: MikeDocumentVersion[]) {
    const sortedDesc = [...versions].sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const groups: {
        key: string;
        label: string;
        count: number;
        newest: MikeDocumentVersion;
        oldest: MikeDocumentVersion;
        restoreTarget: MikeDocumentVersion;
        startIndex: number;
        endIndex: number;
    }[] = [];

    for (let start = 0; start < sortedDesc.length; start += HISTORY_GROUP_SIZE) {
        const chunk = sortedDesc.slice(start, start + HISTORY_GROUP_SIZE);
        if (chunk.length === 0) continue;
        const sources = new Set(chunk.map((version) => version.source));
        const oldest = chunk[chunk.length - 1];
        groups.push({
            key: chunk.map((version) => version.id).join(":"),
            label: historyGroupLabel(sources),
            count: chunk.length,
            newest: chunk[0],
            oldest,
            restoreTarget: oldest,
            startIndex: start + 1,
            endIndex: start + chunk.length,
        });
    }

    return groups;
}

export function DocxTiptapEditor({
    documentId,
    versionId,
    filename,
    onDirtyChange,
    onSaved,
    rounded = true,
    bordered = true,
    autoSave = true,
    autoSaveDelayMs = 3_000,
}: Props) {
    const [baseVersionId, setBaseVersionId] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [restoringVersionId, setRestoringVersionId] = useState<string | null>(
        null,
    );
    const [historyVersions, setHistoryVersions] = useState<
        MikeDocumentVersion[]
    >([]);
    const [, setRelativeTick] = useState(0);
    const onDirtyChangeRef = useRef(onDirtyChange);
    const onSavedRef = useRef(onSaved);
    const saveTimerRef = useRef<number | null>(null);
    const saveAgainRef = useRef(false);
    const savingRef = useRef(false);

    useEffect(() => {
        onDirtyChangeRef.current = onDirtyChange;
        onSavedRef.current = onSaved;
    }, [onDirtyChange, onSaved]);

    useEffect(() => {
        if (!autoSave) return;
        const id = window.setInterval(() => {
            setRelativeTick((tick) => tick + 1);
        }, 30_000);
        return () => window.clearInterval(id);
    }, [autoSave]);

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
            onDirtyChangeRef.current?.(true);
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
            const controller = new AbortController();
            const timeout = window.setTimeout(
                () => controller.abort(),
                EDITOR_FETCH_TIMEOUT_MS,
            );
            let data: Record<string, unknown>;
            try {
                const resp = await fetch(
                    `${apiBase}/single-documents/${documentId}/editor-content${qs}`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                        signal: controller.signal,
                    },
                );
                data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(
                        typeof data.detail === "string"
                            ? data.detail
                            : `HTTP ${resp.status}`,
                    );
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError") {
                    throw new Error("Editor content loading timed out.");
                }
                throw e;
            } finally {
                window.clearTimeout(timeout);
            }
            const pendingEditCount =
                typeof data.pending_edit_count === "number"
                    ? data.pending_edit_count
                    : 0;
            setBaseVersionId(
                typeof data.base_version_id === "string"
                    ? data.base_version_id
                    : null,
            );
            setPendingCount(pendingEditCount);
            setLastSavedAt(new Date());
            editor.commands.setContent(
                typeof data.html === "string" ? data.html : "<p></p>",
                { emitUpdate: false },
            );
            editor.setEditable(pendingEditCount === 0);
            setDirty(false);
            onDirtyChangeRef.current?.(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [documentId, editor, versionId]);

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

    const handleSave = useCallback(async (silent = false) => {
        if (!editor || !baseVersionId || pendingCount > 0) return;
        if (savingRef.current) {
            saveAgainRef.current = true;
            return;
        }
        savingRef.current = true;
        setSaving(true);
        setError(null);
        if (!silent) setNotice(null);
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
            onDirtyChangeRef.current?.(false);
            setLastSavedAt(new Date());
            if (!autoSave) {
                setNotice(
                    `Saved ${data.version_number ? `as V${data.version_number}` : "as a new version"}.`,
                );
            }
            setHistoryVersions((prev) => [
                ...prev,
                {
                    id: data.id,
                    version_number: data.version_number ?? null,
                    source: "manual_edit",
                    created_at: new Date().toISOString(),
                    display_name: null,
                },
            ]);
            onSavedRef.current?.({
                id: data.id,
                version_number: data.version_number ?? null,
                document_id: data.document_id ?? documentId,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            savingRef.current = false;
            setSaving(false);
            if (saveAgainRef.current) {
                saveAgainRef.current = false;
                window.setTimeout(() => void handleSave(true), 0);
            }
        }
    }, [autoSave, baseVersionId, documentId, editor, pendingCount]);

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await listDocumentVersions(documentId);
            setHistoryVersions(res.versions);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setHistoryLoading(false);
        }
    }, [documentId]);

    const handleRestoreVersion = useCallback(
        async (target: MikeDocumentVersion) => {
            if (!editor || restoringVersionId) return;
            setRestoringVersionId(target.id);
            setError(null);
            try {
                const restored = await restoreDocumentVersion(
                    documentId,
                    target.id,
                );
                setBaseVersionId(restored.id);
                setDirty(false);
                onDirtyChangeRef.current?.(false);
                setLastSavedAt(new Date(restored.created_at));
                onSavedRef.current?.({
                    id: restored.id,
                    version_number: restored.version_number ?? null,
                    document_id: restored.document_id,
                });
                setHistoryVersions((prev) => [...prev, restored]);
                setHistoryOpen(false);
                await loadContent();
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setRestoringVersionId(null);
            }
        },
        [documentId, editor, loadContent, restoringVersionId],
    );

    useEffect(() => {
        if (!autoSave || !dirty || loading || pendingCount > 0) return;
        if (saveTimerRef.current !== null) {
            window.clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = window.setTimeout(() => {
            saveTimerRef.current = null;
            void handleSave(true);
        }, autoSaveDelayMs);
        return () => {
            if (saveTimerRef.current !== null) {
                window.clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
        };
    }, [autoSave, autoSaveDelayMs, dirty, handleSave, loading, pendingCount]);

    const subtitle = pendingCount > 0
        ? "Resolve pending AI changes before manual editing."
        : autoSave
          ? saving
              ? "Kaydediliyor..."
              : dirty
                ? "Kaydedilmemiş değişiklikler var."
                : formatRelativeTime(lastSavedAt)
          : "Text-focused editing. Save creates a new version.";
    const historyGroups = groupHistory(historyVersions);

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
                    <p
                        className={`text-[11px] ${pendingCount > 0 ? "text-amber-700" : "text-gray-500"}`}
                    >
                        {subtitle}
                    </p>
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
                    label="Heading 3"
                    active={!!editor?.isActive("heading", { level: 3 })}
                    disabled={!editor || pendingCount > 0}
                    onClick={() =>
                        editor?.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                >
                    <Heading3 className="h-4 w-4" />
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
                    label="Block quote"
                    active={!!editor?.isActive("blockquote")}
                    disabled={!editor || pendingCount > 0}
                    onClick={() =>
                        editor?.chain().focus().toggleBlockquote().run()
                    }
                >
                    <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Horizontal rule"
                    disabled={!editor || pendingCount > 0}
                    onClick={() =>
                        editor?.chain().focus().setHorizontalRule().run()
                    }
                >
                    <Minus className="h-4 w-4" />
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
                {!autoSave && (
                    <button
                        type="button"
                        onClick={() => void handleSave(false)}
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
                )}
                <div className="relative">
                    <ToolbarButton
                        label="History"
                        active={historyOpen}
                        disabled={!editor}
                        onClick={() => {
                            const next = !historyOpen;
                            setHistoryOpen(next);
                            if (next) void loadHistory();
                        }}
                    >
                        <History className="h-4 w-4" />
                    </ToolbarButton>
                    {historyOpen && (
                        <div className="absolute right-0 top-10 z-30 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                            <div className="border-b border-gray-100 px-3 py-2">
                                <p className="text-xs font-medium text-gray-800">
                                    Değişiklik geçmişi
                                </p>
                                <p className="text-[11px] text-gray-400">
                                    Her paket en fazla 10 aksiyon içerir.
                                </p>
                            </div>
                            <div className="max-h-80 overflow-y-auto p-2">
                                {historyLoading ? (
                                    <div className="flex items-center gap-2 px-2 py-3 text-xs text-gray-500">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Yükleniyor...
                                    </div>
                                ) : historyGroups.length === 0 ? (
                                    <p className="px-2 py-3 text-xs text-gray-400">
                                        Henüz değişiklik yok.
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        {historyGroups.map((group) => {
                                            const date = new Date(group.newest.created_at);
                                            const timeLabel =
                                                date.toLocaleString(undefined, {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                });
                                            const targetVersion =
                                                group.restoreTarget
                                                    .version_number;
                                            const restoring =
                                                restoringVersionId ===
                                                group.restoreTarget.id;
                                            return (
                                                <div
                                                    key={group.key}
                                                    className="rounded-md px-2 py-2 hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700">
                                                            {group.label}
                                                        </span>
                                                        <span className="shrink-0 text-[11px] text-gray-400">
                                                            {timeLabel}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <p className="min-w-0 flex-1 text-[11px] text-gray-500">
                                                            {group.count === 1
                                                                ? "Tek aksiyon"
                                                                : `${group.startIndex}-${group.endIndex}. aksiyonlar`}
                                                            {targetVersion
                                                                ? ` · V${targetVersion} noktasına dönebilir`
                                                                : ""}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleRestoreVersion(
                                                                    group.restoreTarget,
                                                                )
                                                            }
                                                            disabled={
                                                                !!restoringVersionId ||
                                                                dirty ||
                                                                saving
                                                            }
                                                            className="inline-flex h-6 shrink-0 items-center gap-1 rounded border border-gray-200 bg-white px-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                            title={
                                                                dirty
                                                                    ? "Önce mevcut değişikliklerin kaydedilmesini bekleyin"
                                                                    : "Bu noktaya dön"
                                                            }
                                                        >
                                                            {restoring ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <RotateCcw className="h-3 w-3" />
                                                            )}
                                                            Dön
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {(error || (!autoSave && notice)) && (
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
