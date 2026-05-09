export const MCP_TOOL_NAMES = new Set([
    "search_bedesten_unified",
    "get_bedesten_document_markdown",
    "search_emsal_detailed_decisions",
    "get_emsal_document_markdown",
    "search_anayasa_unified",
    "get_anayasa_document_unified",
    "search_kvkk_decisions",
    "get_kvkk_document_markdown",
    "search_gib_ozelge",
    "get_gib_ozelge_document_markdown",
    "check_government_servers_health",
]);

export const MCP_TOOLS = [
    {
        type: "function" as const,
        function: {
            name: "search_bedesten_unified",
            description:
                "Search Turkish court decisions across Yargitay, Danistay, local courts, appeals courts, and KYB.",
            parameters: {
                type: "object" as const,
                properties: {
                    phrase: {
                        type: "string",
                        description:
                            'Turkish search query. Supports +required, -excluded, "exact phrase", AND, OR, NOT.',
                    },
                    court_types: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: [
                                "YARGITAYKARARI",
                                "DANISTAYKARAR",
                                "YERELHUKUK",
                                "ISTINAFHUKUK",
                                "KYB",
                            ],
                        },
                        description:
                            "Court types to search. Defaults to Yargitay and Danistay on the MCP server.",
                    },
                    pageNumber: { type: "integer", minimum: 1 },
                    birimAdi: { type: "string" },
                    kararTarihiStart: { type: "string" },
                    kararTarihiEnd: { type: "string" },
                },
                required: ["phrase"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_bedesten_document_markdown",
            description:
                "Retrieve the full Markdown text of a Bedesten-supported court decision by document ID.",
            parameters: {
                type: "object" as const,
                properties: {
                    documentId: {
                        type: "string",
                        description: "Document ID from search_bedesten_unified results.",
                    },
                },
                required: ["documentId"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "search_emsal_detailed_decisions",
            description:
                "Search UYAP Emsal precedent decisions for lower court decisions and case law.",
            parameters: {
                type: "object" as const,
                properties: {
                    keyword: { type: "string" },
                    selected_bam_civil_court: { type: "string" },
                    selected_civil_court: { type: "string" },
                    selected_regional_civil_chambers: {
                        type: "array",
                        items: { type: "string" },
                    },
                    case_year_esas: { type: "string" },
                    decision_year_karar: { type: "string" },
                    start_date: {
                        type: "string",
                        description: "Decision start date in DD.MM.YYYY format.",
                    },
                    end_date: {
                        type: "string",
                        description: "Decision end date in DD.MM.YYYY format.",
                    },
                    page_number: { type: "integer", minimum: 1 },
                },
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_emsal_document_markdown",
            description:
                "Retrieve the full Markdown text of an Emsal precedent decision by ID.",
            parameters: {
                type: "object" as const,
                properties: { id: { type: "string" } },
                required: ["id"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "search_anayasa_unified",
            description:
                "Search Turkish Constitutional Court decisions, including norm control and individual applications.",
            parameters: {
                type: "object" as const,
                properties: {
                    decision_type: {
                        type: "string",
                        enum: ["norm_denetimi", "bireysel_basvuru"],
                    },
                    keywords: {
                        type: "array",
                        items: { type: "string" },
                    },
                    page_to_fetch: { type: "integer", minimum: 1, maximum: 100 },
                    decision_start_date: { type: "string" },
                    decision_end_date: { type: "string" },
                    subject_category: { type: "string" },
                },
                required: ["decision_type"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_anayasa_document_unified",
            description:
                "Retrieve the full text of a Constitutional Court decision from a result URL.",
            parameters: {
                type: "object" as const,
                properties: {
                    document_url: { type: "string" },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["document_url"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "search_kvkk_decisions",
            description:
                "Search Turkish data protection decisions from KVKK.",
            parameters: {
                type: "object" as const,
                properties: {
                    keywords: {
                        type: "string",
                        description:
                            'Turkish keywords. Supports +required, -excluded, and "exact phrase".',
                    },
                    page: { type: "integer", minimum: 1, maximum: 50 },
                },
                required: ["keywords"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_kvkk_document_markdown",
            description:
                "Retrieve the full Markdown text of a KVKK decision by URL.",
            parameters: {
                type: "object" as const,
                properties: {
                    decision_url: { type: "string" },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["decision_url"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "search_gib_ozelge",
            description:
                "Search Turkish Revenue Administration tax rulings on VAT, income tax, corporate tax, stamp duty, and related interpretations.",
            parameters: {
                type: "object" as const,
                properties: {
                    keywords: { type: "string" },
                    ozelgeNo: { type: "string" },
                    kanunNo: { type: "string" },
                    ozelgeStartDate: {
                        type: "string",
                        description: "Start date in YYYY-MM-DD format.",
                    },
                    ozelgeEndDate: {
                        type: "string",
                        description: "End date in YYYY-MM-DD format.",
                    },
                    page: { type: "integer", minimum: 1 },
                    pageSize: { type: "integer", minimum: 1, maximum: 50 },
                },
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_gib_ozelge_document_markdown",
            description:
                "Retrieve the full Markdown text of a GIB tax ruling by numeric ID.",
            parameters: {
                type: "object" as const,
                properties: {
                    ozelge_id: { type: "integer", minimum: 1 },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["ozelge_id"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "check_government_servers_health",
            description:
                "Check whether the Turkish legal database servers are online and responding.",
            parameters: {
                type: "object" as const,
                properties: {},
            },
        },
    },
];
