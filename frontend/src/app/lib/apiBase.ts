export function getApiBaseUrl(): string {
    const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (value) return value.replace(/\/$/, "");

    if (process.env.NODE_ENV !== "production") {
        return "http://localhost:3001";
    }

    throw new Error(
        "NEXT_PUBLIC_API_BASE_URL is required in production builds.",
    );
}
