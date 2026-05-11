export const MEVZUAT_MCP_TOOL_STATUS_MAP: Record<string, string> = {
    // Kanun
    search_kanun: "Kanunlar aranıyor",
    search_within_kanun: "Kanun maddeleri içinde arama yapılıyor",

    // Tebliğ
    search_teblig: "Tebliğler aranıyor",
    get_teblig_content: "Tebliğ metni getiriliyor",
    search_within_teblig: "Tebliğ içinde arama yapılıyor",

    // Cumhurbaşkanlığı Kararnamesi
    search_cbk: "Cumhurbaşkanlığı kararnameleri aranıyor",
    search_within_cbk: "Cumhurbaşkanlığı kararnamesi içinde arama yapılıyor",

    // Cumhurbaşkanlığı Yönetmeliği
    search_cbyonetmelik: "Cumhurbaşkanlığı yönetmelikleri aranıyor",
    search_within_cbyonetmelik:
        "Cumhurbaşkanlığı yönetmeliği içinde arama yapılıyor",

    // Cumhurbaşkanı Kararı
    search_cbbaskankarar: "Cumhurbaşkanı kararları aranıyor",
    get_cbbaskankarar_content: "Cumhurbaşkanı kararı metni getiriliyor",
    search_within_cbbaskankarar:
        "Cumhurbaşkanı kararı içinde arama yapılıyor",

    // Cumhurbaşkanlığı Genelgesi
    search_cbgenelge: "Cumhurbaşkanlığı genelgeleri aranıyor",
    get_cbgenelge_content: "Cumhurbaşkanlığı genelgesi metni getiriliyor",
    search_within_cbgenelge:
        "Cumhurbaşkanlığı genelgesi içinde arama yapılıyor",

    // KHK
    search_khk: "Kanun hükmünde kararnameler aranıyor",
    search_within_khk: "Kanun hükmünde kararname içinde arama yapılıyor",

    // Tüzük
    search_tuzuk: "Tüzükler aranıyor",
    search_within_tuzuk: "Tüzük içinde arama yapılıyor",

    // Kurum Yönetmelikleri
    search_kurum_yonetmelik: "Kurum yönetmelikleri aranıyor",
    search_within_kurum_yonetmelik:
        "Kurum yönetmeliği içinde arama yapılıyor",

    // Unified Bedesten / yeni genel mevzuat araçları
    search_mevzuat: "Mevzuat aranıyor",
    get_mevzuat_content: "Mevzuat metni getiriliyor",
    search_within_mevzuat: "Mevzuat içinde arama yapılıyor",
    get_mevzuat_gerekce: "Mevzuat gerekçesi getiriliyor",
    get_mevzuat_madde_tree: "Mevzuat madde ağacı getiriliyor",
};

export const YARGI_MCP_TOOL_STATUS_MAP: Record<string, string> = {
    // UYAP Emsal
    search_emsal_detailed_decisions: "UYAP emsal kararları aranıyor",
    get_emsal_document_markdown: "UYAP emsal karar metni getiriliyor",

    // Uyuşmazlık Mahkemesi
    search_uyusmazlik_decisions: "Uyuşmazlık Mahkemesi kararları aranıyor",
    get_uyusmazlik_document_markdown_from_url:
        "Uyuşmazlık Mahkemesi karar metni getiriliyor",

    // Anayasa Mahkemesi
    search_anayasa_unified: "Anayasa Mahkemesi kararları aranıyor",
    get_anayasa_document_unified: "Anayasa Mahkemesi karar metni getiriliyor",

    // Kamu İhale Kurumu
    search_kik_v2_decisions: "Kamu İhale Kurumu kararları aranıyor",
    get_kik_v2_document_markdown: "Kamu İhale Kurumu karar metni getiriliyor",

    // Rekabet Kurumu
    search_rekabet_kurumu_decisions: "Rekabet Kurumu kararları aranıyor",
    get_rekabet_kurumu_document: "Rekabet Kurumu karar metni getiriliyor",

    // Bedesten unified court search
    search_bedesten_unified: "Yargı kararları aranıyor",
    get_bedesten_document_markdown: "Yargı kararı metni getiriliyor",

    // Sayıştay
    search_sayistay_unified: "Sayıştay kararları aranıyor",
    get_sayistay_document_unified: "Sayıştay karar metni getiriliyor",

    // Sistem kontrolü
    check_government_servers_health:
        "Hukuki veri kaynaklarının durumu kontrol ediliyor",

    // KVKK
    search_kvkk_decisions: "KVKK kararları aranıyor",
    get_kvkk_document_markdown: "KVKK karar metni getiriliyor",

    // BDDK
    search_bddk_decisions: "BDDK kararları aranıyor",
    get_bddk_document_markdown: "BDDK karar metni getiriliyor",

    // GİB Özelge
    search_gib_ozelge: "Gelir İdaresi özelgeleri aranıyor",
    get_gib_ozelge_document_markdown: "Gelir İdaresi özelge metni getiriliyor",

    // Sigorta Tahkim
    search_sigorta_tahkim_decisions: "Sigorta Tahkim kararları aranıyor",
    get_sigorta_tahkim_document_markdown:
        "Sigorta Tahkim karar dergisi getiriliyor",
    search_within_sigorta_tahkim_issue:
        "Sigorta Tahkim karar dergisi içinde arama yapılıyor",

    // ChatGPT Deep Research compatibility
    search: "Türk hukuk kaynakları genelinde arama yapılıyor",
    fetch: "Hukuki belge metni getiriliyor",
};

const MCP_TOOL_STATUS_MAP: Record<string, string> = {
    ...MEVZUAT_MCP_TOOL_STATUS_MAP,
    ...YARGI_MCP_TOOL_STATUS_MAP,
};

export function getMcpToolStatus(name?: string): string | undefined {
    if (!name) return undefined;
    return MCP_TOOL_STATUS_MAP[name];
}
