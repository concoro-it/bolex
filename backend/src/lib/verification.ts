import type { createServerSupabase } from "./supabase";
import {
    MEVZUAT_MCP_TOOL_NAMES,
    YARGI_MCP_TOOL_NAMES,
} from "./mcp/tools";

type Supa = ReturnType<typeof createServerSupabase>;

export type SourceReferenceRow = {
    id: string;
    source_type: string;
    provider: string;
    tool_name: string | null;
    title: string | null;
    institution: string | null;
    court: string | null;
    chamber: string | null;
    decision_date: string | null;
    case_no: string | null;
    decision_no: string | null;
    legislation_no: string | null;
    article_no: string | null;
    url: string | null;
    quote: string | null;
    verification_status: string;
};

function tryParseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

function stringifyRaw(value: unknown): string {
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function isToolErrorPayload(value: unknown, resultText: string): boolean {
    if (resultText.startsWith("[MCP Error]")) return true;
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    const statusCode = Number(record.status_code);
    if (Number.isFinite(statusCode) && statusCode >= 400) return true;
    return (
        typeof record.error === "string" &&
        ["rate_limit_exceeded", "error", "not_found"].includes(record.error)
    );
}

function firstString(value: unknown, keys: string[]): string | null {
    const seen = new Set<unknown>();
    const visit = (node: unknown): string | null => {
        if (!node || typeof node !== "object" || seen.has(node)) return null;
        seen.add(node);
        const record = node as Record<string, unknown>;
        for (const key of keys) {
            const direct = record[key];
            if (typeof direct === "string" && direct.trim()) return direct.trim();
            if (typeof direct === "number" && Number.isFinite(direct)) {
                return String(direct);
            }
        }
        for (const child of Object.values(record)) {
            if (Array.isArray(child)) {
                for (const item of child) {
                    const found = visit(item);
                    if (found) return found;
                }
            } else if (child && typeof child === "object") {
                const found = visit(child);
                if (found) return found;
            }
        }
        return null;
    };
    return visit(value);
}

function providerForTool(toolName: string): string {
    if (MEVZUAT_MCP_TOOL_NAMES.has(toolName)) return "Mevzuat MCP";
    if (YARGI_MCP_TOOL_NAMES.has(toolName)) return "Yargı MCP";
    if (
        toolName === "search_articles" ||
        toolName === "pdf_to_html" ||
        toolName === "get_article_references"
    ) {
        return "Literatür MCP";
    }
    if (toolName.startsWith("search_yok_tez") || toolName.includes("yok_tez")) {
        return "YÖK Tez MCP";
    }
    if (
        toolName.includes("trademark") ||
        toolName.includes("patent") ||
        toolName.includes("design")
    ) {
        return "Marka Patent MCP";
    }
    return "MCP";
}

function sourceTypeForTool(toolName: string): string {
    if (MEVZUAT_MCP_TOOL_NAMES.has(toolName)) return "legislation";
    if (toolName.includes("gib_ozelge")) return "tax_ruling";
    if (
        toolName.includes("kvkk") ||
        toolName.includes("kik") ||
        toolName.includes("rekabet") ||
        toolName.includes("bddk")
    ) {
        return "administrative_decision";
    }
    if (YARGI_MCP_TOOL_NAMES.has(toolName)) return "case_law";
    return "ai_inference";
}

function verificationStatus(payload: unknown, toolResult: string): string {
    if (toolResult.startsWith("[MCP Error]")) return "not_found";
    const hasCitationField =
        !!firstString(payload, [
            "decision_no",
            "karar_no",
            "kararNo",
            "esas_no",
            "esasNo",
            "mevzuat_no",
            "mevzuatNo",
            "article_no",
            "madde",
            "url",
        ]);
    return hasCitationField ? "verified" : "partial";
}

export function summarizeToolArgs(args: Record<string, unknown>) {
    const summary: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
        if (typeof value === "string") summary[key] = value.slice(0, 240);
        else if (typeof value === "number" || typeof value === "boolean")
            summary[key] = value;
        else if (Array.isArray(value)) summary[key] = value.slice(0, 10);
    }
    return summary;
}

export async function recordVerificationEvent(
    db: Supa,
    payload: {
        userId: string;
        projectId?: string | null;
        chatId?: string | null;
        documentId?: string | null;
        documentVersionId?: string | null;
        eventType: string;
        eventLabel?: string | null;
        toolName?: string | null;
        toolArgsSummary?: Record<string, unknown> | null;
        sourceReferenceIds?: string[];
        relatedEditId?: string | null;
        status?: string;
        metadata?: Record<string, unknown> | null;
    },
) {
    const { error } = await db.from("verification_events").insert({
        user_id: payload.userId,
        project_id: payload.projectId ?? null,
        chat_id: payload.chatId ?? null,
        document_id: payload.documentId ?? null,
        document_version_id: payload.documentVersionId ?? null,
        event_type: payload.eventType,
        event_label: payload.eventLabel ?? null,
        tool_name: payload.toolName ?? null,
        tool_args_summary: payload.toolArgsSummary ?? null,
        source_reference_ids: payload.sourceReferenceIds ?? [],
        related_edit_id: payload.relatedEditId ?? null,
        status: payload.status ?? "ok",
        metadata: payload.metadata ?? null,
    });
    if (error) console.warn("[verification_events] insert failed", error);
}

export async function recordMcpSourceReference(
    db: Supa,
    payload: {
        userId: string;
        projectId?: string | null;
        chatId?: string | null;
        toolName: string;
        args: Record<string, unknown>;
        result: string;
    },
): Promise<SourceReferenceRow | null> {
    const rawPayload = tryParseJson(payload.result);
    if (isToolErrorPayload(rawPayload, payload.result)) {
        await recordVerificationEvent(db, {
            userId: payload.userId,
            projectId: payload.projectId,
            chatId: payload.chatId,
            eventType: "mcp_tool_called",
            eventLabel: payload.toolName,
            toolName: payload.toolName,
            toolArgsSummary: summarizeToolArgs(payload.args),
            status: "warning",
            metadata: {
                error: stringifyRaw(rawPayload).slice(0, 900),
            },
        });
        return null;
    }
    const rawText = stringifyRaw(rawPayload);
    const row = {
        user_id: payload.userId,
        project_id: payload.projectId ?? null,
        chat_id: payload.chatId ?? null,
        source_type: sourceTypeForTool(payload.toolName),
        provider: providerForTool(payload.toolName),
        tool_name: payload.toolName,
        title:
            firstString(rawPayload, [
                "title",
                "baslik",
                "başlık",
                "name",
                "kanun_adi",
                "mevzuat_adi",
            ]) ?? (payload.args.aranacak_ifade as string | undefined) ?? null,
        institution: firstString(rawPayload, ["institution", "kurum", "daire"]),
        court: firstString(rawPayload, ["court", "mahkeme", "yargi_turu"]),
        chamber: firstString(rawPayload, ["chamber", "daire", "birimAdi"]),
        decision_date: firstString(rawPayload, [
            "decision_date",
            "karar_tarihi",
            "kararTarihi",
            "tarih",
        ]),
        case_no: firstString(rawPayload, ["case_no", "esas_no", "esasNo"]),
        decision_no: firstString(rawPayload, [
            "decision_no",
            "karar_no",
            "kararNo",
        ]),
        legislation_no:
            firstString(rawPayload, ["legislation_no", "mevzuat_no", "kanun_no"]) ??
            (payload.args.mevzuat_no as string | undefined) ??
            null,
        article_no:
            firstString(rawPayload, ["article_no", "madde_no", "madde"]) ??
            (payload.args.keyword as string | undefined) ??
            null,
        url: firstString(rawPayload, ["url", "document_url", "detail_page_url"]),
        quote: rawText.slice(0, 900),
        raw_payload:
            typeof rawPayload === "string" ? { text: rawPayload } : rawPayload,
        verification_status: verificationStatus(rawPayload, payload.result),
    };

    const { data, error } = await db
        .from("source_references")
        .insert(row)
        .select(
            "id, source_type, provider, tool_name, title, institution, court, chamber, decision_date, case_no, decision_no, legislation_no, article_no, url, quote, verification_status",
        )
        .single();
    if (error || !data) {
        console.warn("[source_references] insert failed", error);
        return null;
    }
    await recordVerificationEvent(db, {
        userId: payload.userId,
        projectId: payload.projectId,
        chatId: payload.chatId,
        eventType: "mcp_tool_called",
        eventLabel: payload.toolName,
        toolName: payload.toolName,
        toolArgsSummary: summarizeToolArgs(payload.args),
        sourceReferenceIds: [data.id as string],
        status: row.verification_status === "not_found" ? "warning" : "ok",
    });
    return data as SourceReferenceRow;
}

export async function linkSourcesToDocument(
    db: Supa,
    payload: {
        documentId: string;
        documentVersionId?: string | null;
        sourceReferenceIds: string[];
        anchorText?: string | null;
        blockKey?: string | null;
    },
) {
    const sourceIds = [...new Set(payload.sourceReferenceIds)].filter(Boolean);
    if (!sourceIds.length) return;
    const rows = sourceIds.map((sourceId) => ({
        document_id: payload.documentId,
        document_version_id: payload.documentVersionId ?? null,
        source_reference_id: sourceId,
        anchor_type: payload.anchorText ? "quote" : "block",
        anchor_text: payload.anchorText?.slice(0, 1000) ?? null,
        block_key: payload.blockKey ?? null,
    }));
    const { error } = await db.from("document_source_links").insert(rows);
    if (error) console.warn("[document_source_links] insert failed", error);
}
