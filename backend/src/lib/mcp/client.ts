import { getMcpServerUrlForTool } from "./tools";

const REQUEST_TIMEOUT_MS = 30000;
const BEDESTEN_RATE_LIMITED_TOOLS = new Set([
    "search_bedesten_unified",
    "get_bedesten_document_markdown",
]);
const BEDESTEN_MAX_ATTEMPTS = 3;
const BEDESTEN_MIN_INTERVAL_MS = 750;
const BEDESTEN_DEFAULT_RETRY_MS = 3500;

type JsonRpcResponse = {
    error?: { code?: number; message?: string };
    result?: {
        content?: Array<{ type?: string; text?: string }>;
    };
};

let bedestenQueue: Promise<void> = Promise.resolve();
let lastBedestenRequestAt = 0;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withBedestenQueue<T>(fn: () => Promise<T>): Promise<T> {
    const previous = bedestenQueue;
    let release!: () => void;
    bedestenQueue = new Promise<void>((resolve) => {
        release = resolve;
    });

    await previous;
    try {
        const elapsed = Date.now() - lastBedestenRequestAt;
        if (elapsed < BEDESTEN_MIN_INTERVAL_MS) {
            await sleep(BEDESTEN_MIN_INTERVAL_MS - elapsed);
        }
        const result = await fn();
        lastBedestenRequestAt = Date.now();
        return result;
    } finally {
        release();
    }
}

function tryParseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function stringValue(value: unknown, key: string): string | null {
    if (!value || typeof value !== "object") return null;
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
    return null;
}

function textPartsFromRpc(data: unknown): string[] {
    const rpc = data as JsonRpcResponse;
    return (rpc.result?.content ?? [])
        .filter(
            (part): part is { type: string; text: string } =>
                part?.type === "text" && typeof part.text === "string",
        )
        .map((part) => part.text);
}

function rateLimitRetryMs(data: unknown, status: number): number | null {
    const rpc = data as JsonRpcResponse;
    const candidates = [
        rpc.error?.message,
        ...textPartsFromRpc(data),
    ].filter((value): value is string => typeof value === "string");

    for (const candidate of candidates) {
        const parsed = tryParseJson(candidate);
        if (parsed && typeof parsed === "object") {
            const error = stringValue(parsed, "error");
            const statusCode = stringValue(parsed, "status_code");
            const retryAfter = Number(stringValue(parsed, "retry_after"));
            if (
                error === "rate_limit_exceeded" ||
                statusCode === "429" ||
                candidate.includes("token-bucket")
            ) {
                return Number.isFinite(retryAfter) && retryAfter > 0
                    ? Math.ceil(retryAfter * 1000)
                    : BEDESTEN_DEFAULT_RETRY_MS;
            }
        }
        if (
            status === 429 ||
            candidate.includes("rate_limit_exceeded") ||
            candidate.includes("token-bucket") ||
            candidate.includes("eşzamanlılık sınır")
        ) {
            const match = candidate.match(/"retry_after"\s*:\s*"?([\d.]+)"?/);
            const retryAfter = match ? Number(match[1]) : NaN;
            return Number.isFinite(retryAfter) && retryAfter > 0
                ? Math.ceil(retryAfter * 1000)
                : BEDESTEN_DEFAULT_RETRY_MS;
        }
    }

    return status === 429 ? BEDESTEN_DEFAULT_RETRY_MS : null;
}

function parseEventStream(text: string): unknown {
    const dataLines = text
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());
    const last = dataLines.at(-1);
    if (!last) return JSON.parse(text);
    return JSON.parse(last);
}

async function postMcp(
    url: string,
    payload: Record<string, unknown>,
    sessionId?: string,
): Promise<{ data: unknown; sessionId?: string; status: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json, text/event-stream",
                "Content-Type": "application/json",
                ...(sessionId ? { "mcp-session-id": sessionId } : {}),
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        const text = await response.text();
        const nextSessionId = response.headers.get("mcp-session-id") ?? undefined;
        let data: unknown;
        try {
            data = response.headers
                .get("content-type")
                ?.includes("text/event-stream")
                ? parseEventStream(text)
                : JSON.parse(text);
        } catch {
            data = {
                error: {
                    message: `MCP server returned invalid JSON: ${text.slice(0, 500)}`,
                },
            };
        }
        return { data, sessionId: nextSessionId, status: response.status };
    } finally {
        clearTimeout(timeout);
    }
}

async function createSession(url: string): Promise<string | undefined> {
    const id = crypto.randomUUID();
    const { data, sessionId } = await postMcp(
        url,
        {
            jsonrpc: "2.0",
            id,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "bolex-backend", version: "1.0.0" },
            },
        },
    );

    const rpc = data as JsonRpcResponse;
    if (rpc.error) {
        throw new Error(rpc.error.message || "MCP initialize failed");
    }
    return sessionId;
}

async function callMcpToolOnce(
    toolName: string,
    args: Record<string, unknown>,
): Promise<{ text: string; retryAfterMs: number | null }> {
    const id = crypto.randomUUID();
    const url = getMcpServerUrlForTool(toolName);
    const sessionId = await createSession(url);
    const { data, status } = await postMcp(
        url,
        {
            jsonrpc: "2.0",
            id,
            method: "tools/call",
            params: {
                name: toolName,
                arguments: args,
            },
        },
        sessionId,
    );

    const retryAfterMs = BEDESTEN_RATE_LIMITED_TOOLS.has(toolName)
        ? rateLimitRetryMs(data, status)
        : null;

    const rpc = data as JsonRpcResponse;
    if (rpc.error) {
        return {
            text: `[MCP Error] ${rpc.error.message || `HTTP ${status}`} (tool: "${toolName}").`,
            retryAfterMs,
        };
    }

    const textParts = textPartsFromRpc(data);
    return {
        text: textParts.length > 0 ? textParts.join("\n") : JSON.stringify(rpc.result ?? {}),
        retryAfterMs,
    };
}

export async function callMcpTool(
    toolName: string,
    args: Record<string, unknown>,
): Promise<string> {
    const run = async () => {
        for (let attempt = 1; attempt <= BEDESTEN_MAX_ATTEMPTS; attempt++) {
            const result = await callMcpToolOnce(toolName, args);
            if (!result.retryAfterMs || attempt === BEDESTEN_MAX_ATTEMPTS) {
                return result.text;
            }
            await sleep(result.retryAfterMs);
        }
        return `[MCP Error] Retry loop exhausted (tool: "${toolName}").`;
    };

    try {
        if (BEDESTEN_RATE_LIMITED_TOOLS.has(toolName)) {
            return await withBedestenQueue(run);
        }
        return await run();
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Unknown MCP request failure";
        return `[MCP Error] ${message} (tool: "${toolName}").`;
    }
}
