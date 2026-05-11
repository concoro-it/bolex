const DEFAULT_YARGI_MCP_SERVER_URL = "https://yargimcp.surucu.dev/mcp";
const DEFAULT_MEVZUAT_MCP_SERVER_URL = "https://mevzuat.surucu.dev/mcp";

type ToolDefinition = {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[];
        };
    };
};

const searchDatePagingProperties = {
    tam_cumle: {
        type: "boolean",
        description: "Exact phrase match. Defaults to false.",
    },
    baslangic_tarihi: {
        type: "string",
        description: "Start date filter. Use the format expected by the source tool.",
    },
    bitis_tarihi: {
        type: "string",
        description: "End date filter. Use the format expected by the source tool.",
    },
    page_number: { type: "integer", minimum: 1 },
    aranacak_yer: {
        type: "integer",
        minimum: 1,
        maximum: 3,
        description: "1=title only, 2=content only, 3=both title and content.",
    },
    page_size: { type: "integer", minimum: 1, maximum: 100 },
};

const withinSearchProperties = {
    mevzuat_no: {
        type: "string",
        description: "Legislation number from the relevant search result.",
    },
    keyword: {
        type: "string",
        description:
            "Keyword or Boolean query. Use uppercase AND/OR/NOT for keyword mode.",
    },
    mevzuat_tertip: {
        type: "string",
        description: "Legislation series from search results. Defaults to 5.",
    },
    case_sensitive: { type: "boolean" },
    max_results: { type: "integer", minimum: 1, maximum: 50 },
    semantic: {
        type: "boolean",
        description:
            "Use semantic search when available. Requires OPENROUTER_API_KEY on the MCP server.",
    },
};

function legislationSearchTool(
    name: string,
    label: string,
    description: string,
): ToolDefinition {
    return {
        type: "function",
        function: {
            name,
            description,
            parameters: {
                type: "object",
                properties: {
                    aranacak_ifade: {
                        type: "string",
                        description:
                            `Search query for ${label}. Supports Turkish keywords and Boolean operators where supported by the MCP server.`,
                    },
                    ...searchDatePagingProperties,
                },
                required: ["aranacak_ifade"],
            },
        },
    };
}

function withinLegislationTool(
    name: string,
    label: string,
    description: string,
    extraProperties: Record<string, unknown> = {},
): ToolDefinition {
    return {
        type: "function",
        function: {
            name,
            description,
            parameters: {
                type: "object",
                properties: {
                    ...withinSearchProperties,
                    mevzuat_no: {
                        ...withinSearchProperties.mevzuat_no,
                        description: `Legislation number for ${label} from the relevant search result.`,
                    },
                    ...extraProperties,
                },
                required: ["mevzuat_no", "keyword"],
            },
        },
    };
}

function contentTool(
    name: string,
    description: string,
    extraRequired: string[] = [],
): ToolDefinition {
    return {
        type: "function",
        function: {
            name,
            description,
            parameters: {
                type: "object",
                properties: {
                    mevzuat_no: {
                        type: "string",
                        description: "Legislation number from search results.",
                    },
                    mevzuat_tertip: {
                        type: "string",
                        description: "Legislation series from search results. Defaults to 5.",
                    },
                    resmi_gazete_tarihi: {
                        type: "string",
                        description:
                            "Official Gazette date when required by the source result.",
                    },
                },
                required: ["mevzuat_no", ...extraRequired],
            },
        },
    };
}

export const YARGI_MCP_TOOL_NAMES = new Set([
    "search_bedesten_unified",
    "get_bedesten_document_markdown",
    "search_emsal_detailed_decisions",
    "get_emsal_document_markdown",
    "search_uyusmazlik_decisions",
    "get_uyusmazlik_document_markdown_from_url",
    "search_anayasa_unified",
    "get_anayasa_document_unified",
    "search_kik_v2_decisions",
    "get_kik_v2_document_markdown",
    "search_rekabet_kurumu_decisions",
    "get_rekabet_kurumu_document",
    "search_sayistay_unified",
    "get_sayistay_document_unified",
    "search_kvkk_decisions",
    "get_kvkk_document_markdown",
    "search_bddk_decisions",
    "get_bddk_document_markdown",
    "search_gib_ozelge",
    "get_gib_ozelge_document_markdown",
    "search_sigorta_tahkim_decisions",
    "get_sigorta_tahkim_document_markdown",
    "search_within_sigorta_tahkim_issue",
    "search",
    "fetch",
    "check_government_servers_health",
]);

export const MEVZUAT_MCP_TOOL_NAMES = new Set([
    "search_kanun",
    "search_within_kanun",
    "search_teblig",
    "get_teblig_content",
    "search_within_teblig",
    "search_cbk",
    "search_within_cbk",
    "search_cbyonetmelik",
    "search_within_cbyonetmelik",
    "search_cbbaskankarar",
    "get_cbbaskankarar_content",
    "search_within_cbbaskankarar",
    "search_cbgenelge",
    "get_cbgenelge_content",
    "search_within_cbgenelge",
    "search_khk",
    "search_within_khk",
    "search_tuzuk",
    "search_within_tuzuk",
    "search_kurum_yonetmelik",
    "search_within_kurum_yonetmelik",
    "search_mevzuat",
    "get_mevzuat_content",
    "search_within_mevzuat",
    "get_mevzuat_gerekce",
    "get_mevzuat_madde_tree",
]);

export const MCP_TOOL_NAMES = new Set([
    ...YARGI_MCP_TOOL_NAMES,
    ...MEVZUAT_MCP_TOOL_NAMES,
]);

export function getMcpServerUrlForTool(toolName: string): string {
    const legacyYargiUrl = process.env.MCP_SERVER_URL;
    if (YARGI_MCP_TOOL_NAMES.has(toolName)) {
        return (
            process.env.YARGI_MCP_SERVER_URL ||
            legacyYargiUrl ||
            DEFAULT_YARGI_MCP_SERVER_URL
        ).replace(/\/$/, "");
    }
    if (MEVZUAT_MCP_TOOL_NAMES.has(toolName)) {
        return (
            process.env.MEVZUAT_MCP_SERVER_URL ||
            DEFAULT_MEVZUAT_MCP_SERVER_URL
        ).replace(/\/$/, "");
    }
    throw new Error(`Unknown MCP tool: ${toolName}`);
}

const YARGI_MCP_TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "search_bedesten_unified",
            description:
                "Search Turkish court decisions across Yargitay, Danistay, local courts, appeals courts, and KYB.",
            parameters: {
                type: "object",
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
        type: "function",
        function: {
            name: "get_bedesten_document_markdown",
            description:
                "Retrieve the full Markdown text of a Bedesten-supported court decision by document ID.",
            parameters: {
                type: "object",
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
        type: "function",
        function: {
            name: "search_emsal_detailed_decisions",
            description:
                "Search UYAP Emsal precedent decisions for lower court decisions and case law.",
            parameters: {
                type: "object",
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
        type: "function",
        function: {
            name: "get_emsal_document_markdown",
            description:
                "Retrieve the full Markdown text of an Emsal precedent decision by ID.",
            parameters: {
                type: "object",
                properties: { id: { type: "string" } },
                required: ["id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_uyusmazlik_decisions",
            description:
                "Search Uyuşmazlık Mahkemesi decisions for jurisdictional disputes.",
            parameters: {
                type: "object",
                properties: {
                    icerik: { type: "string" },
                    bolum: { type: "string" },
                    uyusmazlik_turu: { type: "string" },
                    karar_sonuclari: {
                        type: "array",
                        items: { type: "string" },
                    },
                    esas_yil: { type: "string" },
                    esas_sayisi: { type: "string" },
                    karar_yil: { type: "string" },
                    karar_sayisi: { type: "string" },
                    kanun_no: { type: "string" },
                    karar_date_begin: { type: "string" },
                    karar_date_end: { type: "string" },
                    resmi_gazete_sayi: { type: "string" },
                    resmi_gazete_date: { type: "string" },
                    tumce: { type: "string" },
                    wild_card: { type: "string" },
                    hepsi: { type: "string" },
                    herhangi_birisi: { type: "string" },
                    not_hepsi: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_uyusmazlik_document_markdown_from_url",
            description:
                "Retrieve the full Markdown text of an Uyuşmazlık Mahkemesi decision by URL.",
            parameters: {
                type: "object",
                properties: {
                    document_url: { type: "string" },
                },
                required: ["document_url"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_anayasa_unified",
            description:
                "Search Turkish Constitutional Court decisions, including norm control and individual applications.",
            parameters: {
                type: "object",
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
        type: "function",
        function: {
            name: "get_anayasa_document_unified",
            description:
                "Retrieve the full text of a Constitutional Court decision from a result URL.",
            parameters: {
                type: "object",
                properties: {
                    document_url: { type: "string" },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["document_url"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_kik_v2_decisions",
            description:
                "Search Turkish Public Procurement Authority (KİK) dispute, regulatory, and court decisions.",
            parameters: {
                type: "object",
                properties: {
                    decision_type: { type: "string" },
                    karar_metni: { type: "string" },
                    karar_no: { type: "string" },
                    basvuran: { type: "string" },
                    idare_adi: { type: "string" },
                    baslangic_tarihi: { type: "string" },
                    bitis_tarihi: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_kik_v2_document_markdown",
            description: "Retrieve the full Markdown text of a KİK decision.",
            parameters: {
                type: "object",
                properties: {
                    gundemMaddesiId: { type: "string" },
                },
                required: ["gundemMaddesiId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_rekabet_kurumu_decisions",
            description:
                "Search Turkish Competition Authority decisions for competition law and antitrust issues.",
            parameters: {
                type: "object",
                properties: {
                    sayfaAdi: { type: "string" },
                    YayinlanmaTarihi: { type: "string" },
                    PdfText: { type: "string" },
                    KararTuru: { type: "string" },
                    KararSayisi: { type: "string" },
                    KararTarihi: { type: "string" },
                    page: { type: "integer", minimum: 1 },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_rekabet_kurumu_document",
            description:
                "Retrieve the full Markdown text of a Turkish Competition Authority decision.",
            parameters: {
                type: "object",
                properties: {
                    karar_id: { type: "string" },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["karar_id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_sayistay_unified",
            description:
                "Search Turkish Court of Accounts (Sayıştay) audit decisions.",
            parameters: {
                type: "object",
                properties: {
                    decision_type: {
                        type: "string",
                        enum: ["genel_kurul", "temyiz_kurulu", "daire"],
                    },
                    start: { type: "integer", minimum: 0 },
                    length: { type: "integer", minimum: 1, maximum: 100 },
                    karar_tarih_baslangic: { type: "string" },
                    karar_tarih_bitis: { type: "string" },
                    kamu_idaresi_turu: { type: "string" },
                    ilam_no: { type: "string" },
                    web_karar_konusu: { type: "string" },
                    karar_no: { type: "string" },
                    karar_ek: { type: "string" },
                    karar_tamami: { type: "string" },
                    ilam_dairesi: { type: "string" },
                    yili: { type: "string" },
                    dosya_no: { type: "string" },
                    temyiz_tutanak_no: { type: "string" },
                    temyiz_karar: { type: "string" },
                    yargilama_dairesi: { type: "string" },
                    hesap_yili: { type: "string" },
                    web_karar_metni: { type: "string" },
                },
                required: ["decision_type"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_sayistay_document_unified",
            description: "Retrieve the full Markdown text of a Sayıştay audit decision.",
            parameters: {
                type: "object",
                properties: {
                    decision_id: { type: "string" },
                    decision_type: {
                        type: "string",
                        enum: ["genel_kurul", "temyiz_kurulu", "daire"],
                    },
                },
                required: ["decision_id", "decision_type"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_kvkk_decisions",
            description: "Search Turkish data protection decisions from KVKK.",
            parameters: {
                type: "object",
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
        type: "function",
        function: {
            name: "get_kvkk_document_markdown",
            description: "Retrieve the full Markdown text of a KVKK decision by URL.",
            parameters: {
                type: "object",
                properties: {
                    decision_url: { type: "string" },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["decision_url"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_bddk_decisions",
            description:
                "Search Turkish Banking Regulation and Supervision Agency (BDDK) decisions.",
            parameters: {
                type: "object",
                properties: {
                    keywords: { type: "string" },
                    page: { type: "integer", minimum: 1 },
                },
                required: ["keywords"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_bddk_document_markdown",
            description: "Retrieve the full Markdown text of a BDDK decision.",
            parameters: {
                type: "object",
                properties: {
                    document_id: { type: "string" },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["document_id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_gib_ozelge",
            description:
                "Search Turkish Revenue Administration tax rulings on VAT, income tax, corporate tax, stamp duty, and related interpretations.",
            parameters: {
                type: "object",
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
        type: "function",
        function: {
            name: "get_gib_ozelge_document_markdown",
            description:
                "Retrieve the full Markdown text of a GIB tax ruling by numeric ID.",
            parameters: {
                type: "object",
                properties: {
                    ozelge_id: { type: "integer", minimum: 1 },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["ozelge_id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_sigorta_tahkim_decisions",
            description:
                "Search Sigorta Tahkim Komisyonu decisions from Hakem Karar Dergisi issues.",
            parameters: {
                type: "object",
                properties: {
                    keywords: { type: "string" },
                    page: { type: "integer", minimum: 1 },
                },
                required: ["keywords"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_sigorta_tahkim_document_markdown",
            description:
                "Retrieve a Sigorta Tahkim Hakem Karar Dergisi issue as Markdown.",
            parameters: {
                type: "object",
                properties: {
                    issue_number: { type: "string" },
                    page_number: { type: "integer", minimum: 1 },
                },
                required: ["issue_number"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_within_sigorta_tahkim_issue",
            description:
                "Search within a specific Sigorta Tahkim Hakem Karar Dergisi issue.",
            parameters: {
                type: "object",
                properties: {
                    issue_number: { type: "string" },
                    keyword: { type: "string" },
                    max_results: { type: "integer", minimum: 1, maximum: 25 },
                },
                required: ["issue_number", "keyword"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search",
            description:
                "Search across all Turkish legal databases in ChatGPT Deep Research compatible format.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string" },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "fetch",
            description:
                "Retrieve a Turkish legal document by ID in ChatGPT Deep Research compatible format.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                },
                required: ["id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "check_government_servers_health",
            description:
                "Check whether the Turkish legal database servers are online and responding.",
            parameters: {
                type: "object",
                properties: {},
            },
        },
    },
];

const MEVZUAT_MCP_TOOLS: ToolDefinition[] = [
    legislationSearchTool(
        "search_kanun",
        "Turkish laws",
        "Search Turkish laws and statutory texts on Mevzuat MCP.",
    ),
    withinLegislationTool(
        "search_within_kanun",
        "Turkish laws",
        "Search within a specific law's articles using keyword or semantic search.",
    ),
    legislationSearchTool(
        "search_teblig",
        "communiques",
        "Search Turkish communiques and notices on Mevzuat MCP.",
    ),
    contentTool("get_teblig_content", "Retrieve the full text of a communique."),
    withinLegislationTool(
        "search_within_teblig",
        "communiques",
        "Search within a specific communique.",
    ),
    legislationSearchTool(
        "search_cbk",
        "presidential decrees",
        "Search Turkish presidential decrees.",
    ),
    withinLegislationTool(
        "search_within_cbk",
        "presidential decrees",
        "Search within a specific presidential decree.",
    ),
    legislationSearchTool(
        "search_cbyonetmelik",
        "presidential regulations",
        "Search Turkish presidential regulations.",
    ),
    withinLegislationTool(
        "search_within_cbyonetmelik",
        "presidential regulations",
        "Search within a specific presidential regulation.",
    ),
    legislationSearchTool(
        "search_cbbaskankarar",
        "presidential decisions",
        "Search Turkish presidential decisions.",
    ),
    contentTool(
        "get_cbbaskankarar_content",
        "Retrieve the full text of a presidential decision.",
    ),
    withinLegislationTool(
        "search_within_cbbaskankarar",
        "presidential decisions",
        "Search within a specific presidential decision.",
        {
            resmi_gazete_tarihi: {
                type: "string",
                description: "Official Gazette date from the search result when required.",
            },
        },
    ),
    legislationSearchTool(
        "search_cbgenelge",
        "presidential circulars",
        "Search Turkish presidential circulars.",
    ),
    contentTool(
        "get_cbgenelge_content",
        "Retrieve the full text of a presidential circular.",
    ),
    withinLegislationTool(
        "search_within_cbgenelge",
        "presidential circulars",
        "Search within a specific presidential circular.",
        {
            resmi_gazete_tarihi: {
                type: "string",
                description: "Official Gazette date from the search result when required.",
            },
        },
    ),
    legislationSearchTool(
        "search_khk",
        "decree laws",
        "Search Turkish decree laws.",
    ),
    withinLegislationTool(
        "search_within_khk",
        "decree laws",
        "Search within a specific decree law.",
    ),
    legislationSearchTool("search_tuzuk", "statutes", "Search Turkish statutes."),
    withinLegislationTool(
        "search_within_tuzuk",
        "statutes",
        "Search within a specific statute.",
    ),
    legislationSearchTool(
        "search_kurum_yonetmelik",
        "institutional regulations",
        "Search Turkish institutional regulations.",
    ),
    withinLegislationTool(
        "search_within_kurum_yonetmelik",
        "institutional regulations",
        "Search within a specific institutional regulation.",
    ),
    {
        type: "function",
        function: {
            name: "search_mevzuat",
            description:
                "Unified search across Turkish legislation on Bedesten/Mevzuat MCP. Prefer this for direct law-number lookup, broad legislation search, current text, and title/content filtering.",
            parameters: {
                type: "object",
                properties: {
                    phrase: {
                        type: "string",
                        description:
                            'Full-text Solr/Lucene query. Supports "exact", +required, -excluded, wildcard*, fuzzy~, proximity, boost.',
                    },
                    mevzuat_adi: {
                        type: "string",
                        description:
                            "Title/name search. Use Turkish keywords, not quoted Solr syntax.",
                    },
                    mevzuat_no: {
                        type: "string",
                        description:
                            "Official legislation number, e.g. 6098 for TBK or 6102 for TTK.",
                    },
                    mevzuat_tur: {
                        type: "string",
                        description:
                            "Type filter: KANUN, CB_KARARNAME, YONETMELIK, CB_YONETMELIK, CB_KARAR, CB_GENELGE, KHK, TUZUK, KKY, UY, TEBLIGLER, MULGA. Comma-separated values are allowed.",
                    },
                    basliktaAra: { type: "boolean" },
                    tamCumle: { type: "boolean" },
                    resmi_gazete_tarihi_start: {
                        type: "string",
                        description: "Official Gazette start date in DD/MM/YYYY format.",
                    },
                    resmi_gazete_tarihi_end: {
                        type: "string",
                        description: "Official Gazette end date in DD/MM/YYYY format.",
                    },
                    resmi_gazete_sayisi: { type: "string" },
                    page: { type: "integer", minimum: 1 },
                    page_size: { type: "integer", minimum: 1, maximum: 100 },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_mevzuat_content",
            description:
                "Retrieve the full text of Turkish legislation by mevzuatId from search_mevzuat.",
            parameters: {
                type: "object",
                properties: {
                    mevzuat_id: {
                        type: "string",
                        description:
                            "Legislation ID from search_mevzuat results, not the law number.",
                    },
                },
                required: ["mevzuat_id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_within_mevzuat",
            description:
                "Search within a specific legislation document's articles by mevzuatId from search_mevzuat.",
            parameters: {
                type: "object",
                properties: {
                    mevzuat_id: {
                        type: "string",
                        description:
                            "Legislation ID from search_mevzuat results, not the law number.",
                    },
                    keyword: {
                        type: "string",
                        description:
                            "Keyword or Boolean query. Use uppercase AND/OR/NOT.",
                    },
                    case_sensitive: { type: "boolean" },
                    max_results: { type: "integer", minimum: 1, maximum: 50 },
                },
                required: ["mevzuat_id", "keyword"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_mevzuat_gerekce",
            description:
                "Retrieve law rationale/gerekce by gerekceId from search_mevzuat results.",
            parameters: {
                type: "object",
                properties: {
                    gerekce_id: {
                        type: "string",
                        description: "Gerekce ID from search_mevzuat results.",
                    },
                },
                required: ["gerekce_id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_mevzuat_madde_tree",
            description:
                "Retrieve the article tree/table of contents for legislation by mevzuatId.",
            parameters: {
                type: "object",
                properties: {
                    mevzuat_id: {
                        type: "string",
                        description:
                            "Legislation ID from search_mevzuat results, not the law number.",
                    },
                },
                required: ["mevzuat_id"],
            },
        },
    },
];

export const MCP_TOOLS: ToolDefinition[] = [
    ...YARGI_MCP_TOOLS,
    ...MEVZUAT_MCP_TOOLS,
];
