import { getMcpServerUrlForTool } from "./tools";

const REQUEST_TIMEOUT_MS = 30000;

type JsonRpcResponse = {
    error?: { code?: number; message?: string };
    result?: {
        content?: Array<{ type?: string; text?: string }>;
    };
};

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

export async function callMcpTool(
    toolName: string,
    args: Record<string, unknown>,
): Promise<string> {
    const id = crypto.randomUUID();

    try {
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

        const rpc = data as JsonRpcResponse;
        if (rpc.error) {
            return `[MCP Error] ${rpc.error.message || `HTTP ${status}`} (tool: "${toolName}").`;
        }

        const content = rpc.result?.content ?? [];
        const textParts = content
            .filter(
                (part): part is { type: string; text: string } =>
                    part?.type === "text" && typeof part.text === "string",
            )
            .map((part) => part.text);

        if (textParts.length > 0) return textParts.join("\n");
        return JSON.stringify(rpc.result ?? {});
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Unknown MCP request failure";
        return `[MCP Error] ${message} (tool: "${toolName}").`;
    }
}
