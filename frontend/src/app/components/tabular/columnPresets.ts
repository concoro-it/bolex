import type { ColumnFormat } from "../shared/types";

export interface ColumnPreset {
    name: string;
    matches: RegExp;
    prompt: string;
    format: ColumnFormat;
    tags?: string[];
}

export const PROMPT_PRESETS: ColumnPreset[] = [
    {
        name: "Taraflar",
        matches: /\bpart(y|ies)\b/i,
        format: "bulleted_list",
        prompt: 'Bu anlaşmadaki tüm tarafları listeleyin. Her taraf için tam yasal adını, kuruluş türünü ve tanımlı rolünü yazın. Örn.:\n• ABC Corp, Delaware merkezli bir şirket ("Şirket")\n• John Smith ("Hissedar")\nHer maddede bir taraf olsun. Ek yorum eklemeyin.',
    },
    {
        name: "Uygulanacak hukuk",
        matches: /\bgoverning law\b|\bjurisdiction\b/i,
        format: "text",
        prompt: 'Yalnızca bu anlaşmanın uygulanacak hukukunu kısa yetki adıyla yazın. Örn. "New York Hukuku", "İngiliz Hukuku", "Hindistan Hukuku", "ÇHC Hukuku". Başka metin eklemeyin.',
    },
    {
        name: "Yürürlük tarihi",
        matches: /\beffective date\b/i,
        format: "date",
        prompt: 'Yalnızca bu anlaşmanın yürürlük tarihini GG Aaa YYYY formatında yazın. Örn. "2 Oca 2026". Açıkça belirtilmemişse "Belirtilmemiş" yazın.',
    },
    {
        name: "Süre",
        matches: /\bterm\b|\bduration\b/i,
        format: "text",
        prompt: 'Yalnızca bu anlaşmanın süresini kısa biçimde yazın. Örn. "3 yıl", "24 ay", "süresiz". Başka metin eklemeyin.',
    },
    {
        name: "Fesih",
        matches: /\bterminat(e|ion|ing)\b/i,
        format: "text",
        prompt: "Fesih hükümlerini çıkarın. Kimlerin feshedebileceğini, tetikleyici olayları, gerekli bildirim süresini, varsa düzeltme süresini ve fesih sonuçlarını belirtin. Kısa olun.",
    },
    {
        name: "Kontrol değişikliği",
        matches: /\bchange of control\b/i,
        format: "text",
        prompt: "Herhangi bir kontrol değişikliği hükmünü tespit edin. Tetikleyici olayları, sonuçları, onay gerekliliklerini ve ilişkili fesih ya da hızlandırma haklarını özetleyin. Kısa olun.",
    },
    {
        name: "Gizlilik",
        matches: /\bconfidential(ity)?\b|\bnon-?disclosure\b/i,
        format: "text",
        prompt: "Gizlilik yükümlülüklerini özetleyin: gizli bilgi kapsamı, izin verilen açıklamalar, kullanım kısıtları, süre ve temel istisnalar.",
    },
    {
        name: "Devir",
        matches: /\bassign(ment|ability)?\b/i,
        format: "yes_no",
        prompt: "Bu anlaşmanın devri diğer tarafın onayı olmadan mümkün mü?",
    },
    {
        name: "Ödeme ve ücretler",
        matches: /\bpayment\b|\bfees?\b/i,
        format: "text",
        prompt: 'Temel ödeme yükümlülüklerini kısa biçimde yazın: tutar, zamanlama ve para birimi. Örn. "Faturadan itibaren 30 gün içinde ödenecek 10.000 USD". Geç ödeme sonuçlarını belirtin.',
    },
    {
        name: "Değişiklik",
        matches: /\bamendment\b|\bvariation\b/i,
        format: "text",
        prompt: "Değişiklik hükümlerini özetleyin: değişikliklerin nasıl yapılabileceğini, kimin onayının gerektiğini ve yazılılık veya imza gibi şekil şartlarını belirtin.",
    },
    {
        name: "Tazminat",
        matches: /\bindemni(ty|ties|fication)\b/i,
        format: "text",
        prompt: "Tazminat hükümlerini özetleyin: kimin kimi tazmin ettiğini, tazmin kapsamındaki zararları, varsa sorumluluk sınırlarını veya istisnaları ve temel talep prosedürlerini belirtin.",
    },
    {
        name: "Garantiler",
        matches: /\bwarrant(y|ies|ing)\b|\brepresentations?\b/i,
        format: "text",
        prompt: "Herhangi bir tarafça verilen temel beyan ve garantileri tespit edip açıklayın; kapsamlarını ve uygulanabilir süre veya koşulları belirtin. Özellikle standart dışı garantileri vurgulayın.",
    },
    {
        name: "Mücbir sebep",
        matches: /\bforce majeure\b/i,
        format: "yes_no",
        prompt: "Bu anlaşmada mücbir sebep maddesi var mı?",
    },
];

export function getPresetConfig(
    title: string,
): Pick<ColumnPreset, "prompt" | "format" | "tags"> | null {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const preset = PROMPT_PRESETS.find(({ matches }) => matches.test(trimmed));
    if (!preset) return null;
    return { prompt: preset.prompt, format: preset.format, tags: preset.tags };
}

export function getPresetPrompt(title: string): string | null {
    return getPresetConfig(title)?.prompt ?? null;
}
