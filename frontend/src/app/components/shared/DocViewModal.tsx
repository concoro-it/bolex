"use client";

import { createPortal } from "react-dom";
import { Download, Pencil, Trash2, X } from "lucide-react";
import { DocView } from "./DocView";
import { getDocumentUrl } from "@/app/lib/mikeApi";
import type { MikeDocument } from "./types";

interface Props {
    doc: MikeDocument | null;
    /** Optional specific version to display. Only honoured for DOCX. */
    versionId?: string | null;
    /** Optional label suffix for the header (e.g. "V3"). */
    versionLabel?: string | null;
    onClose: () => void;
    onEdit?: (doc: MikeDocument) => void;
    onDelete?: (doc: MikeDocument) => void;
}

export function DocViewModal({
    doc,
    versionId,
    versionLabel,
    onClose,
    onEdit,
    onDelete,
}: Props) {
    if (!doc || typeof document === "undefined") return null;

    async function handleDownload() {
        if (!doc) return;
        const { url, filename } = await getDocumentUrl(doc.id, versionId ?? null);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    }

    const isDocx =
        doc.file_type === "docx" ||
        doc.file_type === "doc" ||
        /\.(docx?|DOCX?)$/.test(doc.filename);

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col bg-white rounded-xl shadow-2xl w-[800px] max-w-[90vw] h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-gray-100">
                    <span className="text-base font-medium font-serif text-gray-800 truncate pr-4">
                        {doc.filename}
                        {versionLabel && (
                            <span className="ml-2 text-xs font-normal text-gray-500">
                                {versionLabel}
                            </span>
                        )}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                        {isDocx && onEdit && (
                            <button
                                onClick={() => onEdit(doc)}
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </button>
                        )}
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        {onDelete && (
                            <button
                                onClick={() => { onDelete(doc); onClose(); }}
                                className="flex items-center justify-center w-6 h-6 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col flex-1 overflow-hidden px-3 pb-3">
                    {/* DocView serves PDF when available and falls back to
                       docx-preview internally if the active version has no
                       PDF rendition. Passing no versionId tells the backend
                       to resolve the latest tracked-changes version. */}
                    <DocView
                        key={versionId ?? "current"}
                        doc={{
                            document_id: doc.id,
                            version_id: versionId ?? null,
                        }}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}
