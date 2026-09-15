"use client";

import { Copy, ExternalLink, FileText, Scale } from "lucide-react";
import type { SourceReference } from "./types";

export function sourceTypeLabel(type: SourceReference["source_type"]) {
    const labels: Record<SourceReference["source_type"], string> = {
        legislation: "Mevzuat",
        case_law: "Yargı kararı",
        user_document: "Kullanıcı dokümanı",
        administrative_decision: "İdari karar",
        tax_ruling: "Özelge",
        ai_inference: "AI yorumu",
    };
    return labels[type] ?? type;
}

export function verificationStatusLabel(
    status: SourceReference["verification_status"],
) {
    const labels: Record<SourceReference["verification_status"], string> = {
        verified: "Doğrulandı",
        partial: "Kısmen doğrulandı",
        not_found: "Kaynak bulunamadı",
        user_document: "Kullanıcı dokümanına dayalı",
        ai_inference: "AI yorumu",
    };
    return labels[status] ?? status;
}

export function verificationStatusClass(
    status: SourceReference["verification_status"],
) {
    if (status === "verified" || status === "user_document")
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "not_found")
        return "border-red-200 bg-red-50 text-red-700";
    if (status === "ai_inference")
        return "border-indigo-200 bg-indigo-50 text-indigo-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
}

export function sourceReferenceText(source: SourceReference) {
    return [
        source.title,
        source.court || source.institution,
        source.chamber,
        source.case_no ? `E. ${source.case_no}` : null,
        source.decision_no ? `K. ${source.decision_no}` : null,
        source.decision_date,
        source.legislation_no ? `No: ${source.legislation_no}` : null,
        source.article_no ? `Madde: ${source.article_no}` : null,
        source.quote ? `"${source.quote}"` : null,
    ]
        .filter(Boolean)
        .join(" | ");
}

export function SourceReferenceCard({
    source,
    compact = false,
}: {
    source: SourceReference;
    compact?: boolean;
}) {
    const title = source.title || source.provider || sourceTypeLabel(source.source_type);
    const institution = [source.court || source.institution, source.chamber]
        .filter(Boolean)
        .join(" / ");
    const metadata = [
        source.case_no ? `E. ${source.case_no}` : null,
        source.decision_no ? `K. ${source.decision_no}` : null,
        source.decision_date,
        source.legislation_no ? `No: ${source.legislation_no}` : null,
        source.article_no ? `Madde ${source.article_no}` : null,
    ]
        .filter(Boolean)
        .join(" · ");

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(sourceReferenceText(source));
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-md border border-gray-200 bg-gray-50 p-1.5 text-gray-500">
                    {source.source_type === "case_law" ? (
                        <Scale className="h-3.5 w-3.5" />
                    ) : (
                        <FileText className="h-3.5 w-3.5" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium text-gray-500">
                            {sourceTypeLabel(source.source_type)}
                        </span>
                        <span
                            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${verificationStatusClass(
                                source.verification_status,
                            )}`}
                        >
                            {verificationStatusLabel(source.verification_status)}
                        </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">
                        {title}
                    </p>
                    {institution && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                            {institution}
                        </p>
                    )}
                    {metadata && (
                        <p className="mt-0.5 text-xs text-gray-500">
                            {metadata}
                        </p>
                    )}
                </div>
            </div>
            {source.quote && !compact && (
                <p className="mt-2 line-clamp-3 border-l border-gray-200 pl-2 text-xs leading-relaxed text-gray-600">
                    {source.quote}
                </p>
            )}
            <div className="mt-2 flex items-center gap-2">
                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                    <Copy className="h-3 w-3" />
                    Kaynağı kopyala
                </button>
                {source.url && (
                    <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Detayı aç
                    </a>
                )}
            </div>
        </div>
    );
}
