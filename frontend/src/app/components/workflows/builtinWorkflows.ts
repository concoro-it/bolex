import type { MikeWorkflow } from "../shared/types";

export const BUILT_IN_WORKFLOWS: MikeWorkflow[] = [
    {
        id: "builtin-cp-checklist",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Ön Koşullar Kontrol Listesi Oluştur",
        type: "assistant",
        practice: "Genel İşlemler",
        prompt_md:
            "## Ön Koşullar Kontrol Listesi Oluştur\n\n" +
            "Yüklenen kredi sözleşmesini veya finansman dokümanını incele ve kapsamlı bir " +
            "ön koşullar (CP) kontrol listesi oluştur.\n\n" +
            "Kontrol listesini indirilebilir bir Word dokümanı olarak üretmek için generate_docx aracını MUTLAKA kullan. " +
            "generate_docx aracına landscape: true değerini MUTLAKA ilet — doküman yatay sayfa düzeninde olmalı. " +
            "Kontrol listesini sohbet içinde gösterme — .docx dosyasını oluştur ve indirme bağlantısını ver.\n\n" +
            "Dokümanı şu yapıda hazırla:\n" +
            "- Her koşul kategorisi için (örn. Kurumsal, Finansal, Hukuki, Teminat) başlıklı bir bölüm ekle\n" +
            "- Her kategori başlığı altında tam olarak şu dört sütunu ve bu sırayı içeren bir tablo kullan:\n" +
            "  1. Sıra — kategori içindeki ardışık numara (1, 2, 3…)\n" +
            "  2. Madde Numarası — sözleşmedeki madde veya ek referansı\n" +
            "  3. Madde — ön koşulun kısa açıklaması\n" +
            "  4. Durum — kullanıcının doldurması için boş bırak (empty string)\n\n" +
            "Her kategorinin satırları için section object içindeki table alanını kullan (content alanını kullanma).",
        columns_config: null,
    },
    {
        id: "builtin-coc-dd",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Kontrol değişikliği incelemesi",
        type: "tabular",
        practice: "Şirketler Hukuku",
        prompt_md:
            "## Kontrol Değişikliği Due Diligence İncelemesi\n\n" +
            "Bu workflow, seçili dokümanlar üzerinde kontrol değişikliği odaklı bir due diligence incelemesi yapar.",
        columns_config: [
            {
                index: 0,
                name: "Taraflar",
                format: "bulleted_list",
                prompt: "Bu anlaşmanın tüm taraflarını belirle. Her taraf için tam ticaret unvanını/adını ve rolünü belirt (örn. karşı taraf, lisans veren, kredi veren, tedarikçi).",
            },
            {
                index: 1,
                name: "Tarih",
                format: "date",
                prompt: "Bu anlaşmanın tarihi nedir? Başlangıç tarihi imza tarihinden farklıysa ikisini de belirt.",
            },
            {
                index: 2,
                name: "Süre",
                format: "text",
                prompt: "Bu anlaşmanın süresi nedir? Başlangıç ve bitiş tarihlerini veya sözleşme süresinin uzunluğunu belirt.",
            },
            {
                index: 3,
                name: "Kontrol değişikliği maddesi",
                prompt: "Bu dokümandaki kontrol değişikliği maddesini/maddelerini belirle ve özetle. Tetikleyici ifadeyi aynen alıntıla ve hangi durumların 'kontrol değişikliği' sayıldığını belirt.",
            },
            {
                index: 4,
                name: "Onay gerekli",
                prompt: "Kontrol değişikliği için herhangi bir tarafın önceden onayı gerekiyor mu? Kimin onay vermesi gerektiğini, bildirim süresini ve varsa koşulları belirt.",
            },
            {
                index: 5,
                name: "Fesih hakları",
                prompt: "Kontrol değişikliği halinde hangi fesih hakları doğar? Kim feshedebilir ve bildirim şartları nelerdir?",
            },
            {
                index: 6,
                name: "Put/Call opsiyonları",
                prompt: "Kontrol değişikliğiyle tetiklenen put veya call opsiyonları var mı? Koşulları, fiyatlandırmayı ve kullanım süresini özetle.",
            },
            {
                index: 7,
                name: "Finansal etkiler",
                prompt: "Kontrol değişikliğinin finansal sonuçları nelerdir? Ücretleri, ödemeleri, muaccel hale gelen yükümlülükleri veya fiyat ayarlamalarını dahil et.",
            },
        ],
    },
    {
        id: "builtin-credit-summary",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Kredi sözleşmesi özeti",
        type: "assistant",
        practice: "Finans",
        prompt_md:
            "## Kredi Sözleşmesi Özeti\n\n" +
            "Yüklenen kredi sözleşmesini incele ve aşağıdaki başlıkları kapsayan kapsamlı bir hukuki özet hazırla. " +
            "Her bölümde temel hükümleri belirle, ilgili madde veya ek referanslarını alıntıla ve olağan dışı, ağır veya piyasa standardından sapan hükümleri işaretle.\n\n" +
            "1. **Kredi Verenler** — Tüm kredi verenler veya kredi sendikası üyeleri; tam ticaret unvanları/adları ve rolleriyle birlikte (örn. yetkilendirilmiş lider düzenleyici, ilk kredi veren, ajan banka)\n" +
            "2. **Borçlular** — Tüm borçlular; tam ticaret unvanları/adları ve kuruluş ülkeleriyle birlikte\n" +
            "3. **Kefiller** — Tüm kefiller; tam ticaret unvanları/adları ve kefalet yükümlülüklerinin kapsamıyla birlikte\n" +
            "4. **Diğer Taraflar** — Diğer önemli taraflar (örn. kredi temsilcisi, teminat temsilcisi, hedge karşı tarafları, ihraç bankası) ve rolleri\n" +
            "5. **Sözleşme Tarihi** — Kredi sözleşmesinin tarihi\n" +
            "6. **Kredi Limitleri** — Kullanılabilir her kredi limiti (örn. rotatif kredi limiti, Term Loan A, Term Loan B, Term Loan C), limit türü, dilim adı ve temel yapısal özellikler\n" +
            "7. **Tutar** — Tüm limitlerdeki toplam taahhüt tutarı, para birimi ve varsa dilim bazında dağılım\n" +
            "8. **Amaç** — Kullanımların hangi amaçla yapılabileceği ve kullanım amacına ilişkin kısıtlamalar\n" +
            "9. **Faiz** — Uygulanacak referans oran (örn. SOFR, EURIBOR, baz oran), marj, varsa marj ayarlama mekanizması ve faiz dönemlerinin yapısı\n" +
            "10. **Taahhüt Ücreti** — Taahhüt veya kullanım ücretleri, uygulanacak oran, hesaplama yöntemi ve baz alınan tutar (örn. kullanılmamış taahhüt, ortalama kullanım)\n" +
            "11. **Geri Ödeme Planı** — Her kredi limiti için geri ödeme profili; taksitli ödeme mi yoksa vade sonunda tek ödeme mi olduğu ve geri ödeme tarihleri/tutarları\n" +
            "12. **Vade** — Her kredi limiti için nihai vade tarihi\n" +
            "13. **Teminat** — Verilen veya verilmesi gereken teminat türleri (örn. pay rehni, sabit ve değişken teminatlar, taşınmaz ipotekleri, hesap rehinleri) ve teminat kapsamındaki varlıklar veya kuruluşlar\n" +
            "14. **Kefaletler** — Kefalet yükümlülükleri, kefiller, kefaletin kapsamı ve varsa sınırlamalar (örn. yukarı yönlü kefalet sınırlamaları, kefil kapsama testi)\n" +
            "15. **Finansal Taahhütler** — Her finansal taahhüt, ölçütü (örn. kaldıraç oranı, faiz karşılama, nakit akışı karşılama), uygulanacak test, test sıklığı ve varsa sermaye enjeksiyonu ile iyileştirme hakları\n" +
            "16. **Temerrüt Olayları** — Her temerrüt olayı; varsa ek süreler, önemlilik eşikleri veya çapraz temerrüt hükümleriyle birlikte\n" +
            "17. **Devir** — Devir veya temlike ilişkin izinler ya da kısıtlamalar (örn. beyaz/kara listeler, kredi veren devirleri için borçlu onayı; borçlunun devir kısıtlamaları)\n" +
            "18. **Kontrol Değişikliği** — Kontrol değişikliğinin ne olduğu, hangi yükümlülükleri tetiklediği (örn. zorunlu erken ödeme, iptal, kredi veren onayı) ve varsa düzeltme süresi\n" +
            "19. **Erken Ödeme Ücreti** — Erken ödeme ücretleri, make-whole primleri veya soft-call korumaları; uygulanacak ücret, geçerli olduğu dönem ve istisnalar (örn. sigorta gelirlerinden veya varlık satışlarından erken ödeme)\n" +
            "20. **Uygulanacak Hukuk** — Sözleşmeye uygulanacak hukuk\n" +
            "21. **Uyuşmazlık Çözümü** — Uyuşmazlıkların mahkemeye mi tahkime mi gideceği, seçilen forum veya tahkim yeri ve yetki hükümleri\n\n" +
            "Özeti sohbet yanıtında doğrudan ver — generate_docx çağırma. Yalnızca kullanıcı açıkça isterse indirilebilir bir Word dokümanı üret.",
        columns_config: null,
    },

    // ─── Commercial Agreement ───────────────────────────────────────────────────
    {
        id: "builtin-commercial-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Ticari anlaşma incelemesi",
        type: "tabular",
        practice: "Genel İşlemler",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Taraflar",
                format: "bulleted_list",
                prompt: "Bu anlaşmanın tüm taraflarını belirle. Her taraf için tam ticaret unvanını/adını, kuruluş ülkesini (belirtilmişse) ve anlaşmadaki rolünü belirt (örn. tedarikçi, müşteri, lisans veren).",
            },
            {
                index: 1,
                name: "İş kapsamı",
                format: "text",
                prompt: "Bu anlaşma kapsamında sunulacak iş veya hizmet kapsamını özetle. Temel çıktılar, yükümlülükler veya hizmetler nelerdir? Kapsama ilişkin sınırlama veya istisnaları belirt.",
            },
            {
                index: 2,
                name: "Önceki anlaşmayı değiştirir",
                format: "yes_no",
                prompt: "Bu anlaşma önceki bir anlaşmayı değiştiriyor, yeniden düzenliyor, tamamlıyor veya yerine geçiyor mu? Evet ise önceki anlaşmayı adı ve tarihiyle belirt.",
            },
            {
                index: 3,
                name: "Yürürlük tarihi",
                format: "date",
                prompt: "Bu anlaşmanın yürürlük veya başlangıç tarihi nedir? Açık bir tarih yoksa ne zaman yürürlüğe girmiş sayıldığını belirt.",
            },
            {
                index: 4,
                name: "Süre",
                format: "text",
                prompt: "Bu anlaşmanın süresi nedir? İlk süreyi ve süreyi etkileyen koşulları belirt.",
            },
            {
                index: 5,
                name: "Yenileme",
                format: "text",
                prompt: "Hangi yenileme hükümleri uygulanır? Yenilemenin otomatik mi yoksa bildirime bağlı mı olduğunu, yenileme dönemini ve otomatik yenilemeyi önlemek için gereken koşulları veya bildirim sürelerini belirt.",
            },
            {
                index: 6,
                name: "Fiyatlandırma",
                format: "text",
                prompt: "Bu anlaşmadaki fiyatlandırma yapısı nedir? Tüm ücretleri, oranları, masrafları ve ödeme şartlarını; para birimi, ödeme takvimi ve faturalama gereklilikleriyle birlikte belirt.",
            },
            {
                index: 7,
                name: "Fiyat ayarlamaları",
                format: "text",
                prompt: "Bu anlaşmada fiyat ayarlama mekanizmaları var mı? Endeksleme, CPI/RPI bağlantısı, karşılaştırmalı fiyatlama, hacme dayalı ayarlamalar veya sözleşme süresince fiyatların değişmesine izin veren diğer mekanizmaları belirt.",
            },
            {
                index: 8,
                name: "Geç ödeme cezaları",
                format: "text",
                prompt: "Geç ödeme halinde hangi cezalar veya sonuçlar uygulanır? Gecikmiş tutarlara uygulanacak faiz oranlarını, askıya alma haklarını veya alacaklının kullanabileceği diğer yolları dahil et.",
            },
            {
                index: 9,
                name: "Tahmini sözleşme bedeli",
                format: "monetary_amount",
                prompt: "Toplam tahmini veya belirtilen sözleşme bedeli nedir? Tek bir tutar verilmemişse belirtilen oranlar ve süreye göre hesapla veya tahmin et. Para birimini ve varsayımları belirt.",
            },
            {
                index: 10,
                name: "Sorumluluğun sınırlandırılması",
                format: "text",
                prompt: "Hangi sorumluluk sınırlamaları uygulanır? Sorumluluk üst sınırlarını (nasıl hesaplandıkları dahil), dolaylı zarar veya sonuç zararlarının hariç tutulmasını ve üst sınırdan istisna edilen halleri belirt (örn. hile, ölüm, fikri mülkiyet ihlali).",
            },
            {
                index: 11,
                name: "Fikri mülkiyet sahipliği ve lisanslama",
                format: "text",
                prompt: "Fikri mülkiyet sahipliği ve lisanslama nasıl düzenlenmiş? Mevcut fikri mülkiyetin kime ait olduğunu, yeni oluşturulan fikri mülkiyetin kime ait olacağını ve taraflara hangi lisansların verildiğini belirt. Kullanım kısıtlamalarını not et.",
            },
            {
                index: 12,
                name: "Kontrol değişikliği",
                format: "text",
                prompt: "Kontrol değişikliği hükmü var mı? Varsa, kontrol değişikliğinin ne sayıldığını, onay gerekip gerekmediğini ve hangi hakları tetiklediğini açıkla (örn. fesih, devir).",
            },
            {
                index: 13,
                name: "Mücbir sebep",
                format: "text",
                prompt: "Mücbir sebep maddesini özetle. Hangi olaylar kapsama giriyor, hangi yükümlülükler askıya alınıyor, fesih hakkı doğmadan önce olay ne kadar sürmeli ve hangi bildirim gerekiyor?",
            },
            {
                index: 14,
                name: "Fesih hakları",
                format: "text",
                prompt: "Tarafların fesih hakları nelerdir? Sebepsiz fesih (bildirim süresi dahil), haklı nedenle fesih (düzeltme süreleri dahil) ve feshin sonuçlarını belirle (örn. ödeme yükümlülükleri, yürürlükte kalacak hükümler).",
            },
            {
                index: 15,
                name: "Sabit tazminatlar",
                format: "text",
                prompt: "Sabit tazminat hükümleri var mı? Varsa, hangi durumlarda tetiklendiğini, uygulanacak oranı veya formülü, toplam sabit tazminat üst sınırını ve münhasır başvuru yolu olup olmadığını belirt.",
            },
            {
                index: 16,
                name: "Uygulanacak hukuk",
                format: "text",
                prompt: "Bu anlaşmaya hangi hukuk uygulanır? Yetki alanını ve atıf yapılan özel hukuk sistemini belirt.",
            },
            {
                index: 17,
                name: "Uyuşmazlık çözümü",
                format: "text",
                prompt: "Bu anlaşma kapsamında uyuşmazlıklar nasıl çözülür? Uyuşmazlıkların mahkemeye mi tahkime mi gideceğini, seçilen forum veya tahkim yerini, resmi süreçlerden önce zorunlu eskalasyon veya arabuluculuk adımlarını ve yargılama dilini belirt.",
            },
        ],
    },

    // ─── Credit Agreement ────────────────────────────────────────────────────────
    {
        id: "builtin-credit-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Kredi sözleşmesi incelemesi",
        type: "tabular",
        practice: "Finans",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Borç verenler",
                format: "bulleted_list",
                prompt: "Bu sözleşmede adı geçen tüm kredi verenleri (veya kredi sendikasını) belirle. Her biri için tam ticaret unvanını/adını ve rolünü belirt (örn. yetkilendirilmiş lider düzenleyici, ilk kredi veren, ajan banka).",
            },
            {
                index: 1,
                name: "Borçlular",
                format: "bulleted_list",
                prompt: "Bu sözleşmede adı geçen tüm borçluları, tam ticaret unvanları/adları ve kuruluş ülkeleriyle birlikte belirle.",
            },
            {
                index: 2,
                name: "Kefiller",
                format: "bulleted_list",
                prompt: "Bu sözleşmede adı geçen tüm kefilleri, tam ticaret unvanları/adları ve kefalet yükümlülüklerinin kapsamıyla birlikte belirle.",
            },
            {
                index: 3,
                name: "Diğer taraflar",
                format: "bulleted_list",
                prompt: "Bu sözleşmenin diğer önemli taraflarını belirle (örn. kredi temsilcisi, teminat temsilcisi, hedge karşı tarafları, ihraç bankası). Adlarını ve rollerini belirt.",
            },
            {
                index: 4,
                name: "Sözleşme tarihi",
                format: "date",
                prompt: "Bu kredi sözleşmesinin tarihi nedir?",
            },
            {
                index: 5,
                name: "Kredi limiti",
                format: "bulleted_list",
                prompt: "Bu sözleşme kapsamında kullanılabilir her kredi limitini listele (örn. rotatif kredi limiti, Term Loan A, Term Loan B, Term Loan C). Her biri için limit türünü, dilim adını ve temel yapısal özellikleri belirt.",
            },
            {
                index: 6,
                name: "Tutar",
                format: "monetary_amount",
                prompt: "Bu sözleşme kapsamında tüm limitlerde kullanılabilir toplam taahhüt tutarı nedir? Tutarı, para birimini ve varsa dilim bazında dağılımı belirt.",
            },
            {
                index: 7,
                name: "Amaç",
                format: "text",
                prompt: "Bu sözleşme kapsamında kullanılacak borçların belirtilen amacı nedir? Kullanım amacına ilişkin kısıtlamaları belirle.",
            },
            {
                index: 8,
                name: "Faiz",
                format: "text",
                prompt: "Bu sözleşme kapsamındaki borçlanmalara hangi faiz oranı uygulanır? Uygulanacak oranı (örn. SOFR, EURIBOR, baz oran), marjı, varsa marj ayarlama mekanizmasını ve faiz dönemlerinin nasıl yapılandırıldığını belirt.",
            },
            {
                index: 9,
                name: "Taahhüt ücreti",
                format: "text",
                prompt: "Taahhüt ücreti veya kullanım ücreti var mı? Varsa uygulanacak oranı, nasıl hesaplandığını ve hangi baz üzerinden hesaplandığını belirt (örn. kullanılmamış taahhüt, ortalama kullanım).",
            },
            {
                index: 10,
                name: "Geri ödeme planı",
                format: "text",
                prompt: "Her kredi limiti için geri ödeme planını özetle. Geri ödemenin taksitli mi yoksa vade sonunda tek ödeme şeklinde mi olduğunu belirt ve varsa geri ödeme tarihlerini ve tutarlarını yaz.",
            },
            {
                index: 11,
                name: "Vade",
                format: "date",
                prompt: "Bu sözleşme kapsamındaki kredi limitlerinin nihai vade tarihi nedir? Farklı limitlerin farklı vadeleri varsa her birini belirt.",
            },
            {
                index: 12,
                name: "Teminat",
                format: "bulleted_list",
                prompt: "Bu sözleşme kapsamında hangi teminatlar verilmiş veya verilmesi gerekiyor? Her teminat türünü (örn. pay rehni, sabit ve değişken teminatlar, taşınmaz ipotekleri, hesap rehinleri) ve teminatın alındığı varlıkları veya kuruluşları listele.",
            },
            {
                index: 13,
                name: "Garantiler",
                format: "bulleted_list",
                prompt: "Bu sözleşme kapsamında veya bağlantılı olarak hangi kefalet yükümlülükleri verilmiş? Kefilleri, kefaletin kapsamını ve varsa sınırlamaları belirt (örn. yukarı yönlü kefalet sınırlamaları, kefil kapsama testi).",
            },
            {
                index: 14,
                name: "Finansal kısıtlamalar",
                format: "bulleted_list",
                prompt: "Bu sözleşmede hangi finansal taahhütler yer alıyor? Her taahhüt için ölçütü (örn. kaldıraç oranı, faiz karşılama, nakit akışı karşılama), uygulanacak testi, test sıklığını ve varsa sermaye enjeksiyonu ile iyileştirme haklarını belirt.",
            },
            {
                index: 15,
                name: "Temerrüt olayları",
                format: "bulleted_list",
                prompt: "Bu sözleşmedeki temerrüt olaylarını listele. Her biri için varsa ek süreleri, önemlilik eşiklerini veya çapraz temerrüt hükümlerini not et.",
            },
            {
                index: 16,
                name: "Devir",
                format: "text",
                prompt: "Bu sözleşme kapsamında hakların devri veya temliki için hangi izinler ya da kısıtlamalar uygulanır? Kredi veren devirlerine ilişkin kısıtlamaları (örn. beyaz/kara listeler, borçlu onayı) ve borçlunun devir kısıtlamalarını belirt.",
            },
            {
                index: 17,
                name: "Kontrol değişikliği",
                format: "text",
                prompt: "Kontrol değişikliği hükmü var mı? Varsa, kontrol değişikliğinin ne sayıldığını, hangi yükümlülükleri tetiklediğini (örn. zorunlu erken ödeme, iptal, kredi veren onayı) ve herhangi bir düzeltme süresi olup olmadığını belirt.",
            },
            {
                index: 18,
                name: "Erken ödeme ücreti",
                format: "text",
                prompt: "Erken ödeme ücretleri, make-whole primleri veya soft-call korumaları var mı? Varsa uygulanacak ücreti, geçerli olduğu dönemi ve istisnaları belirt (örn. sigorta gelirlerinden veya varlık satışından erken ödeme).",
            },
            {
                index: 19,
                name: "Uygulanacak hukuk",
                format: "text",
                prompt: "Bu sözleşmeye hangi hukuk uygulanır? Yetki alanını ve atıf yapılan özel hukuk sistemini belirt.",
            },
            {
                index: 20,
                name: "Uyuşmazlık çözümü",
                format: "text",
                prompt: "Bu sözleşme kapsamında uyuşmazlıklar nasıl çözülür? Uyuşmazlıkların mahkemeye mi tahkime mi gideceğini, seçilen forumu veya tahkim yerini ve yetki hükümlerini belirt.",
            },
        ],
    },

    // ─── E-Discovery ─────────────────────────────────────────────────────────────
    {
        id: "builtin-ediscovery",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "E-Discovery incelemesi",
        type: "tabular",
        practice: "Dava",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Tarih",
                format: "date",
                prompt: "Bu dokümanın tarihi nedir? E-posta veya yazışmalarda gönderim tarihini kullan. Diğer dokümanlarda oluşturulma, imza veya dokümanda öne çıkan tarihi esas al.",
            },
            {
                index: 1,
                name: "Doküman türü",
                format: "text",
                prompt: "Bu dokümanın türü nedir? (örn. e-posta, not, mektup, sözleşme, rapor, toplantı tutanağı, kısa mesaj, fatura, sunum). Spesifik ol.",
            },
            {
                index: 2,
                name: "Gönderen",
                format: "text",
                prompt: "Bu dokümanın göndereni veya yazarı kim? Belirlenebiliyorsa tam adını, unvanını ve kurumunu belirt.",
            },
            {
                index: 3,
                name: "Alıcı(lar)",
                format: "bulleted_list",
                prompt: "Bu dokümanın alıcıları kimler? Belirlenebiliyorsa tüm Alıcı, CC ve BCC kişilerini listele. Her biri için tam ad, unvan ve kurum bilgisini belirt. Alıcı, CC veya BCC alanlarından hangisinde yer aldığını not et.",
            },
            {
                index: 4,
                name: "Özet",
                format: "text",
                prompt: "Bu dokümanın içeriğini 2–4 cümlede kısa ve olgusal şekilde özetle. Ana konuya, alınan kararlara, talep edilen aksiyonlara veya iletilen bilgilere odaklan. Hukuki sonuç çıkarma.",
            },
            {
                index: 5,
                name: "Bahsi geçen kişiler",
                format: "bulleted_list",
                prompt: "Bu dokümanda adı geçen tüm kişileri listele (daha önce belirlenen gönderen ve alıcılar hariç). Her kişi için adını ve anlaşılabiliyorsa rolünü veya kurumunu belirt.",
            },
            {
                index: 6,
                name: "Ayrıcalıklı mı?",
                format: "yes_no",
                prompt: "Bu doküman hukuki ayrıcalık kapsamında görünüyor mu? Hukuki görüş almak veya vermek amacıyla avukat-müvekkil arasında yapılmış bir iletişimse ya da ağırlıklı olarak dava amacıyla oluşturulmuşsa Evet yanıtını ver. Aksi halde Hayır yanıtını ver. Emin değilsen belirsizliğin nedenini belirt.",
            },
        ],
    },

    // ─── Supply Agreement ────────────────────────────────────────────────────────
    {
        id: "builtin-supply-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Tedarik sözleşmesi incelemesi",
        type: "tabular",
        practice: "Genel İşlemler",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Taraflar",
                format: "bulleted_list",
                prompt: "Bu tedarik sözleşmesinin tüm taraflarını belirle. Her biri için tam ticaret unvanını/adını, kuruluş ülkesini (belirtilmişse) ve rolünü belirt (örn. tedarikçi, alıcı, distribütör).",
            },
            {
                index: 1,
                name: "Yürürlük tarihi",
                format: "date",
                prompt: "Bu sözleşmenin yürürlük veya başlangıç tarihi nedir? Açık bir tarih yoksa ne zaman yürürlüğe girmiş sayıldığını belirt.",
            },
            {
                index: 2,
                name: "Ürünler",
                format: "bulleted_list",
                prompt: "Bu sözleşme kapsamında hangi ürünler tedarik edilecek? Her ürün veya ürün kategorisini; ilgili teknik özellikler, parça numaraları veya atıf yapılan standartlarla birlikte listele.",
            },
            {
                index: 3,
                name: "Süre",
                format: "text",
                prompt: "Bu sözleşmenin ilk süresi nedir? Başlangıç tarihini (veya ne zaman başlayacağına ilişkin referansı) ve bitiş tarihini ya da süre uzunluğunu belirt.",
            },
            {
                index: 4,
                name: "Yenileme",
                format: "text",
                prompt: "Hangi yenileme hükümleri uygulanır? Yenileme otomatik mi yoksa tarafların anlaşmasına mı bağlı? Yenileme dönemini, yenilemeyi önlemek için gereken bildirim şartlarını ve yenileme koşullarını belirt.",
            },
            {
                index: 5,
                name: "Teslimat",
                format: "text",
                prompt: "Hangi teslim yükümlülükleri ve şartları uygulanır? Teslim şartlarını (örn. Incoterms), teslim sürelerini, teslim yerlerini, hasar riskini ve geç ya da başarısız teslimin sonuçlarını belirt.",
            },
            {
                index: 6,
                name: "Kalite",
                format: "text",
                prompt: "Ürünler için hangi kalite standartları veya teknik özellikler uygulanır? Geçerli standartları (örn. ISO, düzenleyici gereklilikler), denetim haklarını, kabul prosedürlerini ve uygunsuzluğun sonuçlarını belirt.",
            },
            {
                index: 7,
                name: "Garantiler",
                format: "text",
                prompt: "Tedarikçi ürünlerle ilgili hangi garantileri veriyor? Garanti süresini, garanti kapsamını (örn. ayıpsız olma, teknik özelliklere uygunluk), ihlal halinde başvuru yolunu (örn. onarım, değiştirme, iade) ve istisnaları belirt.",
            },
            {
                index: 8,
                name: "Sabit tazminatlar",
                format: "text",
                prompt: "Sabit tazminat hükümleri var mı? Varsa neyin tetiklediğini (örn. geç teslim, kalite standartlarının karşılanmaması), uygulanacak oranı veya formülü, toplam üst sınırı ve münhasır başvuru yolu olarak düzenlenip düzenlenmediğini belirt.",
            },
            {
                index: 9,
                name: "Sorumluluğun sınırlandırılması",
                format: "text",
                prompt: "Hangi sorumluluk sınırlamaları uygulanır? Sorumluluk üst sınırlarını ve nasıl hesaplandıklarını (örn. sözleşme bedeli, ödenen ücretler), dolaylı zarar veya sonuç zararlarının hariç tutulmasını ve sınırlama dışı halleri belirt (örn. hile, kastî davranış, ölüm veya kişisel yaralanma).",
            },
            {
                index: 10,
                name: "Mücbir sebep",
                format: "text",
                prompt: "Mücbir sebep maddesini özetle. Hangi olaylar kapsama giriyor, hangi yükümlülükler askıya alınıyor, hangi bildirim yapılmalı, taraflardan biri feshedebilmeden önce olay ne kadar sürmeli ve mücbir sebep nedeniyle feshin sonuçları nelerdir?",
            },
            {
                index: 11,
                name: "Fesih hakları",
                format: "text",
                prompt: "Her tarafın fesih hakları nelerdir? Sebepsiz fesih (bildirim süresi dahil) ile haklı nedenle feshi (düzeltme süreleri ve tetikleyici haller dahil) ayır. Fesih halinde bekleyen satın alma siparişleri veya ödeme yükümlülükleri dahil ne olacağını belirt.",
            },
            {
                index: 12,
                name: "Uygulanacak hukuk",
                format: "text",
                prompt: "Bu sözleşmeye hangi hukuk uygulanır? Yetki alanını ve atıf yapılan özel hukuk sistemini belirt.",
            },
            {
                index: 13,
                name: "Uyuşmazlık çözümü",
                format: "text",
                prompt: "Bu sözleşme kapsamında uyuşmazlıklar nasıl çözülür? Uyuşmazlıkların mahkemeye mi tahkime mi gideceğini, seçilen forumu veya tahkim yerini ve resmi süreçlerden önce zorunlu eskalasyon adımlarını (örn. müzakere, arabuluculuk) belirt.",
            },
        ],
    },

    // ─── SPA ─────────────────────────────────────────────────────────────────────
    {
        id: "builtin-spa",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Hisse alım sözleşmesi incelemesi",
        type: "tabular",
        practice: "Şirketler Hukuku",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Taraflar",
                format: "bulleted_list",
                prompt: "Bu hisse alım sözleşmesinin tüm taraflarını belirle. Her biri için tam ticaret unvanını/adını, kuruluş ülkesini (belirtilmişse) ve rolünü belirt (örn. satıcı, alıcı, hedef şirket, garanti veren, kefil).",
            },
            {
                index: 1,
                name: "Tarih",
                format: "date",
                prompt: "Bu hisse alım sözleşmesinin tarihi nedir?",
            },
            {
                index: 2,
                name: "İşlem",
                format: "text",
                prompt: "İşlemi özetle. Hangi hisseler veya paylar, hangi hedef şirket veya şirketlerde devralınıyor ve işlemin niteliği nedir (örn. %100 satın alma, çoğunluk payı, azınlık yatırımı)?",
            },
            {
                index: 3,
                name: "Bedel",
                format: "monetary_amount",
                prompt: "Bu sözleşme kapsamında ödenecek bedel nedir? Toplam ana bedeli, para birimini ve yapıyı belirt (örn. nakit, hisse, borç senedi, ertelenmiş bedel, earn-out). Bedel ayarlamaya tabi ise (örn. locked box, kapanış hesapları), mekanizmayı açıkla.",
            },
            {
                index: 4,
                name: "Temel ön koşullar",
                format: "bulleted_list",
                prompt: "Tamamlamaya ilişkin temel ön koşulları (CP) listele. Her ön koşul için neyin sağlanması veya kim tarafından feragat edilmesi gerektiğini belirt. Ön koşulların yerine getirilmesi gereken son tarihi varsa belirt.",
            },
            {
                index: 5,
                name: "Tamamlama tarihi",
                format: "text",
                prompt: "Tamamlama ne zaman gerçekleşir? Tüm ön koşullar sağlandıktan veya bunlardan feragat edildikten kaç iş günü sonra tamamlamanın yapılacağını ve/veya tamamlamaya ilişkin sabit son tarihi belirt. İmzadan sonra belirli bir tarihe kadar tamamlama yükümlülüğü olup olmadığını not et.",
            },
            {
                index: 6,
                name: "Garantiler",
                format: "text",
                prompt: "Garanti paketini özetle. Garantileri kim veriyor (örn. satıcı, yönetim, tüm satıcılar müştereken ve müteselsilen)? Ticari garantiler ve/veya mülkiyet garantileri var mı? Garanti açıklama sürecinin kapsamını ve garanti taleplerine ilişkin sınırlamaları belirt (örn. süre sınırları, asgari talep eşikleri, toplam üst sınır).",
            },
            {
                index: 7,
                name: "Tazminatlar",
                format: "text",
                prompt: "Bu sözleşmede özel tazmin taahhütleri var mı? Varsa temel tazmin taahhütlerini, kim tarafından ve hangi olası yükümlülükler için verildiğini listele (örn. vergi tazmini, çevresel tazmin, dava tazmini). Tazmin taleplerine uygulanacak süre sınırlarını veya üst sınırları not et.",
            },
            {
                index: 8,
                name: "Sorumluluğun sınırlandırılması",
                format: "text",
                prompt: "Garanti ve tazmin taleplerine hangi sorumluluk sınırlamaları uygulanır? Toplam üst sınırı ve nasıl hesaplandığını (örn. bedelin yüzdesi), temel garantiler veya tazminler için ayrı üst sınırları, asgari talep eşiklerini (de minimis ve basket/deductible) ve talep ileri sürme sürelerini belirt.",
            },
            {
                index: 9,
                name: "Taahhütler",
                format: "text",
                prompt: "Satıcı veya yönetim tarafından hangi kısıtlayıcı veya diğer taahhütler verilmiş? Rekabet etmeme, müşteri/personel kaçırmama ve işlem yapmama taahhütlerini dahil et; her biri için kapsamı (faaliyetler ve coğrafya) ve süreyi belirt.",
            },
            {
                index: 10,
                name: "Münhasırlık",
                format: "text",
                prompt: "Bu sözleşmede münhasırlık veya no-shop hükmü var mı? Varsa münhasırlık süresini, hangi faaliyetlerin kısıtlandığını (örn. rakip teklif alma, üçüncü kişilerle görüşme) ve istisnaları veya break fee düzenlemelerini belirt.",
            },
            {
                index: 11,
                name: "Uygulanacak hukuk ve yetki",
                format: "text",
                prompt: "Bu sözleşmeye hangi hukuk uygulanır ve hangi mahkemeler veya tahkim mercileri yetkilidir? Seçilen hukuku, uyuşmazlık forumunu ve yetkinin münhasır olup olmadığını belirt.",
            },
            {
                index: 12,
                name: "Uyuşmazlık çözümü",
                format: "text",
                prompt: "Bu sözleşme kapsamında uyuşmazlıklar nasıl çözülür? Uyuşmazlıkların mahkemeye mi tahkime mi gideceğini, seçilen tahkim yerini veya forumu, uygulanacak kuralları (tahkim varsa) ve zorunlu uyuşmazlık öncesi eskalasyon adımlarını belirt.",
            },
        ],
    },

    // ─── NDA ─────────────────────────────────────────────────────────────────────
    {
        id: "builtin-nda",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Gizlilik anlaşması incelemesi",
        type: "tabular",
        practice: "Genel İşlemler",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Yön",
                format: "tag",
                tags: ["Karşılıklı", "Tek taraflı"],
                prompt: "Bu gizlilik anlaşması karşılıklı mı (iki taraf da birbirine karşı gizlilik yükümlülüğü altında) yoksa tek taraflı mı (yalnızca bir taraf gizlilik yükümlülüğü altında)? Yönünü belirle ve açıklayan/alıcı tarafı veya tarafları adlandır.",
            },
            {
                index: 1,
                name: "Gizli bilgilerin tanımı",
                format: "text",
                prompt: "Bu anlaşmada 'Gizli Bilgi' nasıl tanımlanmış? Geniş mi dar mı düzenlenmiş? Bilginin gizli olarak işaretlenmesi gerekiyor mu, yoksa amaçla bağlantılı paylaşılan tüm bilgiler otomatik olarak kapsama giriyor mu? Açık dahil etme veya istisnaları not et.",
            },
            {
                index: 2,
                name: "Alıcı tarafın yükümlülükleri",
                format: "bulleted_list",
                prompt: "Alıcı tarafın gizli bilgilere ilişkin temel yükümlülükleri nelerdir? Her yükümlülüğü listele (örn. gizli tutma, üçüncü kişilere açıklamama, yalnızca izin verilen amaç için kullanma, belirli bir özen standardı uygulama, erişimi bilmesi gereken kişilerle sınırlama).",
            },
            {
                index: 3,
                name: "Standart istisnalar var mı?",
                format: "yes_no",
                prompt: "Anlaşma gizlilik yükümlülüklerine ilişkin standart istisnaları içeriyor mu? Anlaşma şu bilgileri kapsam dışında bırakıyorsa Evet yanıtını ver: (a) ihlal olmaksızın kamuya açık olan veya sonradan kamuya açık hale gelen; (b) alıcı tarafça zaten bilinen; (c) bağımsız geliştirilen; ve (d) üçüncü kişiden kısıtlama olmaksızın alınan bilgiler. Eksik olan veya standart formülden farklı düzenlenen istisnaları not et.",
            },
            {
                index: 4,
                name: "İzin verilen açıklamalar",
                format: "bulleted_list",
                prompt: "Alıcı taraf gizli bilgileri kimlere açıklayabilir? İzin verilen alıcı kategorilerini listele (örn. çalışanlar, profesyonel danışmanlar, bağlı şirketler, finansman tarafları, düzenleyici otoriteler). Sonraki açıklamalar için alıcının eşdeğer yükümlülüklerle bağlı olması gerekip gerekmediğini belirt.",
            },
            {
                index: 5,
                name: "Süre ve devam",
                format: "text",
                prompt: "Bu gizlilik anlaşmasının süresi nedir ve gizlilik yükümlülükleri ne kadar devam eder? Anlaşmanın ilk süresini ve gizlilik yükümlülüklerinin süresini belirt; fesihten sonra devam edip etmediklerini ve ne kadar sürdüklerini not et.",
            },
            {
                index: 6,
                name: "İade ve imha",
                format: "text",
                prompt: "Sürenin sona ermesi veya fesih halinde gizli bilgilerin iadesi ya da imhasına ilişkin hangi yükümlülükler uygulanır? İade ve imha arasında seçim hakkı var mı? İmhanın belgelendirilmesi gerekiyor mu? Saklama istisnaları var mı (örn. düzenleyici amaçlar, BT yedekleme sistemleri)?",
            },
            {
                index: 7,
                name: "Başvuru yolları",
                format: "text",
                prompt: "Gizlilik yükümlülüklerinin ihlali halinde hangi başvuru yolları kullanılabilir? Anlaşma, tazminatın yetersiz kalabileceğini ve ihtiyati tedbir veya aynen ifanın mümkün olduğunu kabul ediyor mu? İhlal için kararlaştırılmış sabit tazminat veya tazmin taahhüdü var mı?",
            },
            {
                index: 8,
                name: "Uygulanacak hukuk ve yetki",
                format: "text",
                prompt: "Bu anlaşmaya hangi hukuk uygulanır ve hangi mahkemeler yetkilidir? Seçilen hukuku, forumu ve yetkinin münhasır olup olmadığını belirt.",
            },
        ],
    },

    // ─── Commercial Lease ─────────────────────────────────────────────────────────
    {
        id: "builtin-commercial-lease",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Ticari kira sözleşmesi incelemesi",
        type: "tabular",
        practice: "Gayrimenkul",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Kiraya veren",
                format: "text",
                prompt: "Bu kira sözleşmesinde kiraya veren kimdir? Tam ticaret unvanını/adını, kuruluş veya kayıt ülkesini (uygunsa) ve belirtilmişse kayıtlı adresini veya tapu numarasını belirt.",
            },
            {
                index: 1,
                name: "Kiracı",
                format: "text",
                prompt: "Bu kira sözleşmesinde kiracı kimdir? Tam ticaret unvanını/adını, kuruluş veya kayıt ülkesini (uygunsa) ve belirtilmişse kayıtlı adresini belirt.",
            },
            {
                index: 2,
                name: "Kefil",
                format: "text",
                prompt: "Bu kira sözleşmesi kapsamında kefil var mı? Varsa kefilin tam ticaret unvanını/adını ve kefaletin kapsamını belirt (örn. kiracının tüm yükümlülükleri için tam kefalet veya belirli yükümlülüklerle sınırlı kefalet). Kefil yoksa bunu açıkça belirt.",
            },
            {
                index: 3,
                name: "Taşınmaz",
                format: "text",
                prompt: "Bu kira sözleşmesiyle kiralanan taşınmazı tanımla. Adresi, kat(lar)ı, bağımsız bölüm referansını, net iç alanı (belirtilmişse) ve kiralama kapsamına dahil veya hariç alanları belirt (örn. ortak alanlar, çatı, yapı, otopark).",
            },
            {
                index: 4,
                name: "Kira tarihi",
                format: "date",
                prompt: "Bu kira sözleşmesinin tarihi nedir? Sözleşme tarihsizse veya kira süresinin başlangıç tarihi imza tarihinden farklıysa ikisini de belirt.",
            },
            {
                index: 5,
                name: "Süre",
                format: "text",
                prompt: "Bu kira sözleşmesinin sözleşmesel süresi nedir? Sürenin uzunluğunu, başlangıç ve bitiş tarihlerini belirt.",
            },
            {
                index: 6,
                name: "Kira",
                format: "monetary_amount",
                prompt: "Bu kira sözleşmesi kapsamında ödenecek ilk yıllık kira nedir? Tutarı, para birimini, ödeme sıklığını (örn. üç ayda bir peşin) ve ödeme tarihlerini belirt. Kirasız dönem veya başlangıçta indirimli kira varsa not et.",
            },
            {
                index: 7,
                name: "Kira incelemesi",
                format: "text",
                prompt: "Kira uyarlama/gözden geçirme hükümleri var mı? Varsa gözden geçirme tarihlerini veya sıklığını, mekanizmayı (örn. piyasa rayici incelemesi, RPI/CPI endekslemesi, sabit artış), artış yönlü olup olmadığını, piyasa rayici incelemesine uygulanacak varsayım ve dikkate alınmayacak unsurları ve taraflar yeni kira üzerinde anlaşamazsa uygulanacak uyuşmazlık çözüm mekanizmasını belirt.",
            },
            {
                index: 8,
                name: "Ortak gider",
                format: "text",
                prompt: "Kiracı ortak gider veya hizmet bedelinden sorumlu mu? Varsa hangi masrafların bu bedele dahil olduğunu, kiracının payını veya yüzdesini, üst sınır olup olmadığını ve hizmet bedelinin nasıl yönetilip mahsuplaştırıldığını açıkla.",
            },
            {
                index: 9,
                name: "Sigorta",
                format: "text",
                prompt: "Bu kira sözleşmesi kapsamındaki sigorta yükümlülükleri nelerdir? Sigortayı kimin yaptıracağını (kiraya veren veya kiracı), hangi risklerin sigortalanacağını, sigorta primini kimin karşılayacağını ve kiracının kiraya verenin sigortasına ilişkin yükümlülüklerini belirt (örn. poliçeyi geçersiz kılmamak, primi ek kira olarak ödemek).",
            },
            {
                index: 10,
                name: "İzin verilen kullanım",
                format: "text",
                prompt: "Bu kira sözleşmesi kapsamında taşınmazın izin verilen kullanım amacı nedir? İzin verilen kullanım sınıfını veya belirli kullanım amacını ve kullanım kısıtlamalarını belirt. Kullanım değişikliği için kiraya verenin onayı gerekip gerekmediğini ve onayın hangi gerekçelerle verilmeyebileceğini not et.",
            },
            {
                index: 11,
                name: "Onarım ve bakım",
                format: "text",
                prompt: "Taşınmazın onarım ve bakımından kim sorumludur? Kiracının onarım yükümlülüğünün kapsamını açıkla (örn. tam onarım, yalnızca iç alan onarımı, durum tespit çizelgesine tabi). Yapı, dış cephe veya ortak alanlara ilişkin kiraya verenin onarım yükümlülükleri varsa belirt.",
            },
            {
                index: 12,
                name: "Değişiklikler",
                format: "text",
                prompt: "Kiracı taşınmazda hangi değişiklikleri yapabilir? Yapısal ve yapısal olmayan değişiklikleri ayır. Kiraya verenin onayı gerekiyor mu; gerekiyorsa hangi gerekçelerle verilmeyebilir? Süre sonunda kiracının değişiklikleri eski hâline getirmesi gerekiyor mu?",
            },
            {
                index: 13,
                name: "Devir ve alt kiralama",
                format: "text",
                prompt: "Kiracının kira hakkını devretme veya taşınmazı alt kiraya verme hakları nelerdir? Devir ve alt kiralamanın kiraya veren onayıyla mümkün olup olmadığını, onayın hangi gerekçelerle verilmeyebileceğini, sağlanması gereken koşulları (örn. devirde yetkili kefalet anlaşması, alt kirada mevcut kiradan düşük olmama) ve tamamen yasaklanan işlemleri belirt.",
            },
            {
                index: 14,
                name: "Çıkış hakları",
                format: "text",
                prompt: "Bu kira sözleşmesinde erken çıkış hakkı var mı? Varsa bu hakkın kimde olduğunu (kiraya veren, kiracı veya her ikisi), çıkış tarihlerini, hakkın kullanılması için gereken bildirim süresi ve şeklini ve etkin kullanım için ön koşulları belirt (örn. esaslı ihlal olmaması, boş teslim, tüm borçların ödenmiş olması).",
            },
            {
                index: 15,
                name: "Kira güvencesi",
                format: "yes_no",
                prompt: "Kiracının kanuni kira güvencesi var mı (örn. İngiltere ve Galler'de Landlord and Tenant Act 1954 veya başka bir ülkedeki eşdeğer mevzuat kapsamında)? Kira sözleşmesi bu koruma kapsamındaysa veya bu güvenceden yararlanıyorsa Evet yanıtını ver. Kapsam dışında bırakılmışsa veya kira güvencesi uygulanmıyorsa Hayır yanıtını ver. Yanıtının dayanağını belirt.",
            },
            {
                index: 16,
                name: "Teslim yükümlülükleri",
                format: "text",
                prompt: "Süre sonunda hangi teslim ve eski hâle getirme yükümlülükleri uygulanır? Kiracının teslim yükümlülüklerini açıkla (örn. taşınmazı onarılmış şekilde teslim etme, değişiklikleri eski hâline getirme, yeniden boyama). Kiracının sorumluluğunu sınırlayan bir durum tespit çizelgesi var mı? Kiraya verenin talebine ilişkin üst sınır veya başka sınırlama varsa not et.",
            },
            {
                index: 17,
                name: "Kira depozitosu",
                format: "monetary_amount",
                prompt: "Kira depozitosu gerekiyor mu? Varsa tutarı, ne kadar süre tutulacağını, kiraya verenin hangi koşullarda depozitodan tahsilat yapabileceğini ve hangi hallerde kiracıya iade edileceğini belirt.",
            },
            {
                index: 18,
                name: "Hakkın kaybı ve fesih",
                format: "text",
                prompt: "Kiraya verenin sözleşmeyi sona erdirme veya hakkı kaybettirme hakları nelerdir? Kiraya verene kira sözleşmesini sona erdirme hakkı veren olayları (örn. ek süreden sonra kiranın ödenmemesi, önemli sözleşme ihlali, aciz hâli) ve bu hakkın kullanılmasından önce gereken bildirim şartlarını belirt.",
            },
            {
                index: 19,
                name: "Uygulanacak hukuk",
                format: "text",
                prompt: "Bu kira sözleşmesine hangi hukuk uygulanır ve uyuşmazlıklarda hangi mahkemeler yetkilidir?",
            },
        ],
    },

    // ─── Limited Partnership Agreement ───────────────────────────────────────────
    {
        id: "builtin-lpa",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Sınırlı ortaklık sözleşmesi incelemesi",
        type: "tabular",
        practice: "Özel Sermaye",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Genel ortak",
                format: "text",
                prompt: "Fonun genel ortağını/ortaklarını belirle. Tam ticaret unvanını/adını, kuruluş ülkesini ve sözleşmede adı geçen bağlı yönetim kuruluşlarını belirt (örn. fon yöneticisi veya yatırım danışmanı).",
            },
            {
                index: 1,
                name: "Fon adı ve yetki alanı",
                format: "text",
                prompt: "Fonun tam adı nedir ve sınırlı ortaklık hangi ülkede kurulmuş veya tescil edilmiştir?",
            },
            {
                index: 2,
                name: "Toplam taahhüt edilen sermaye",
                format: "monetary_amount",
                prompt: "Fonun toplam taahhüt edilen sermayesi nedir? Hedef büyüklüğü, varsa üst limiti, para birimini ve belirtilmişse kapanış tarihini veya tarihlerini belirt.",
            },
            {
                index: 3,
                name: "Sermaye çağrıları ve çekimler",
                format: "text",
                prompt: "Genel ortak sınırlı ortaklardan sermayeyi nasıl ve ne zaman çağırabilir? Sermaye çağrıları için bildirim süresini, çağrı bildiriminin nasıl yapılacağını, çağrı sıklığı veya tutarına ilişkin sınırlamaları ve kullanılmamış taahhütlerin geri ödeme sonrasında yeniden çağrılıp çağrılamayacağını belirt.",
            },
            {
                index: 4,
                name: "Fonlama yapılmamasının sonuçları",
                format: "text",
                prompt: "Bir sınırlı ortak sermaye çağrısını fonlamazsa sonuçları nelerdir? Uygulanacak yaptırımları açıkla (örn. eksik tutar üzerinden faiz, payın seyreltilmesi, indirimli zorunlu devir, oy veya dağıtım haklarının kaybı, gelecekteki yatırımlardan dışlanma). Yaptırımlar uygulanmadan önce düzeltme süresi var mı?",
            },
            {
                index: 5,
                name: "Yatırım kapsamı ve kısıtlamalar",
                format: "text",
                prompt: "Fonun belirtilen yatırım stratejisi, kapsamı ve kısıtlamaları nelerdir? İzin verilen sektörleri, coğrafyaları, yatırım aşamalarını, araç türlerini ve yoğunlaşma sınırlarını dahil et (örn. tek bir yatırım için taahhüt edilen sermayenin azami yüzdesi). Genel ortağın belirtilen stratejiden sapma konusunda ne kadar takdir yetkisi olduğunu not et.",
            },
            {
                index: 6,
                name: "Fon süresi",
                format: "text",
                prompt: "Fonun süresi nedir? İlk süreyi (örn. nihai kapanıştan itibaren 10 yıl), izin verilen uzatma dönemlerini (örn. 2 × 1 yıllık uzatma), uzatmaları kimin onaylayacağını (yalnızca genel ortak veya sınırlı ortak/LPAC onayıyla) ve erken sona erme mekanizmalarını belirt.",
            },
            {
                index: 7,
                name: "Yönetim ücreti",
                format: "text",
                prompt: "Genel ortağa veya yöneticiye hangi yönetim ücreti ödenir? Ücret oranını, hesaplama bazını (örn. yatırım döneminde taahhüt edilen sermaye, sonrasında yatırılmış sermaye veya net varlık değeri), fon süresi boyunca uygulanacak düşüşleri ve ödeme sıklığını belirt.",
            },
            {
                index: 8,
                name: "Carry payı",
                format: "text",
                prompt: "Genel ortağa hangi taşınan faiz/başarı payı (carry) ödenir? Carry yüzdesini, yapıyı (Avrupa tipi/fon düzeyi waterfall veya Amerikan tipi/işlem bazlı) ve dağıtım waterfall adımlarını sırayla belirt (örn. sermayenin iadesi, tercihli getiri, GP catch-up, ardından kâr paylaşımı).",
            },
            {
                index: 9,
                name: "Tercihli getiri (eşik oran)",
                format: "percentage",
                prompt: "Genel ortağın carry kazanmasından önce sınırlı ortakların alması gereken tercihli getiri veya eşik oran var mı? Oranı, bileşik uygulanıp uygulanmadığını (ve hangi bazda) ve nasıl hesaplandığını belirt (örn. yatırılmış sermaye, katkı yapılan sermaye üzerinden). Tercihli getiri yoksa bunu açıkça belirt.",
            },
            {
                index: 10,
                name: "GP catch-up",
                format: "text",
                prompt: "Tercihli getiri sağlandıktan sonra GP catch-up mekanizması var mı? Varsa nasıl işlediğini açıkla: catch-up sürecinde dağıtımların hangi yüzdesi genel ortağa gider ve bu mekanizmanın hedeflediği ekonomik sonuç nedir (örn. genel ortağın bugüne kadarki tüm kârların %20'sini alması).",
            },
            {
                index: 11,
                name: "Geri alma",
                format: "text",
                prompt: "Genel ortak fazla carry alırsa geri ödeme (clawback) yükümlülüğü var mı? Clawback'in fon düzeyinde mi yoksa bireysel ortak düzeyinde mi hesaplandığını, ne zaman tetiklendiğini, clawback yükümlülüğüne ilişkin üst sınır veya sınırlamaları ve bu yükümlülüğü destekleyen escrow veya teminat düzenlemesi olup olmadığını belirt.",
            },
            {
                index: 12,
                name: "Ücret ve giderler (yönetim ücreti hariç)",
                format: "bulleted_list",
                prompt: "Yönetim ücreti dışında fon veya sınırlı ortaklara hangi ücret ve giderler yansıtılır? Her kategoriyi listele (örn. işlem ücretleri, izleme ücretleri, gerçekleşmeyen işlem giderleri, kuruluş giderleri, hukuk ücretleri, fon idaresi giderleri, organizasyon giderleri). Her biri için maliyeti kimin üstlendiğini ve herhangi bir tutarın yönetim ücretinden mahsup edilip edilmediğini belirt.",
            },
            {
                index: 13,
                name: "Dağıtımlar",
                format: "text",
                prompt: "Sınırlı ortaklara dağıtımlar nasıl ve ne zaman yapılır? Dağıtımların zamanlamasını (örn. yatırımların realize edilmesi üzerine veya genel ortağın takdirine bağlı olarak), genel ortağın yatırım dönemi içinde gelirleri yeniden yatırıma yönlendirip yönlendiremeyeceğini ve dağıtımların ayni olarak yapılıp yapılamayacağını belirt (yani nakit yerine menkul kıymet olarak).",
            },
            {
                index: 14,
                name: "Kilit kişi maddesi",
                format: "text",
                prompt: "Kilit kişi maddesi var mı? Belirlenen kilit kişileri belirt. Kilit kişi olayını ne tetikler (örn. ayrılma, çalışamaz hâle gelme, zaman taahhüdünün belirli bir eşiğin altına düşmesi)? Sonuçları nelerdir (örn. yatırım döneminin askıya alınması)? Sınırlı ortakların kilit kişi olayı sonrasında sona erdirme veya devam konusunda oy kullanma hakkı var mı?",
            },
            {
                index: 15,
                name: "Genel ortağın azli",
                format: "text",
                prompt: "Genel ortak hangi durumlarda azledilebilir? Haklı nedenle azil (örn. hile, ağır ihmal, kastî kötü davranış — gereken sınırlı ortak oy eşiğini belirt) ile nedensiz azli ayır (sınırlı ortak oy eşiğini ve azil halinde carry'nin nasıl ele alınacağı gibi sonuçları belirt).",
            },
            {
                index: 16,
                name: "Danışma komitesi (LPAC)",
                format: "text",
                prompt: "Sınırlı Ortak Danışma Komitesi (LPAC) veya benzer bir yönetişim organı var mı? Varsa bileşimini, üyelerin nasıl seçildiğini, temel yetki ve sorumluluklarını (örn. çıkar çatışmalarını, değerlemeleri, uzatmaları, ilişkili taraf işlemlerini onaylama) ve onayının bağlayıcı mı yoksa yalnızca danışma niteliğinde mi olduğunu açıkla.",
            },
            {
                index: 17,
                name: "Devir kısıtlamaları",
                format: "text",
                prompt: "Bir sınırlı ortağın fondaki payını devretmesine veya temlik etmesine hangi kısıtlamalar uygulanır? Genel ortak onayı gerekir mi? İzin verilen devir istisnaları var mı (örn. bağlı şirketlere)? İkincil piyasa satışlarına izin veriliyor mu; veriliyorsa hangi koşullara veya öncelikli satın alma haklarına tabi?",
            },
            {
                index: 18,
                name: "Çıkar çatışmaları",
                format: "text",
                prompt: "Sözleşme çıkar çatışmalarını nasıl ele alıyor? Fonlar arasındaki işlem tahsis politikasını, sınırlı ortaklara tanınan ortak yatırım haklarını, ilişkili taraf işlemlerine ilişkin kısıtlamaları ve çıkar çatışmalarının incelenmesi veya onaylanmasında LPAC'nin rolünü açıkla. Açıkça öngörülen özel çıkar çatışması senaryolarını not et.",
            },
            {
                index: 19,
                name: "Uygulanacak hukuk",
                format: "text",
                prompt: "Bu sözleşmeye hangi hukuk uygulanır ve uyuşmazlıklarda hangi mahkemeler veya tahkim mercileri yetkilidir?",
            },
        ],
    },

    // ─── Shareholder Agreement (Assistant) ───────────────────────────────────────
    {
        id: "builtin-sha-summary",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Hissedarlık sözleşmesi özeti",
        type: "assistant",
        practice: "Şirketler Hukuku",
        prompt_md:
            "## Hissedarlık Sözleşmesi Özeti\n\n" +
            "Yüklenen hissedarlık sözleşmesini incele ve aşağıdaki başlıkları kapsayan kapsamlı bir hukuki özet hazırla. " +
            "Her bölümde temel hükümleri belirle, ilgili madde referanslarını alıntıla ve olağan dışı, ağır veya piyasa standardından sapan hükümleri işaretle.\n\n" +
            "1. **Taraflar ve Pay Sahiplikleri** — Tam ticaret unvanları/adları, roller, sahip olunan pay sınıfları ve yüzde oranları (belirtilmişse tam seyreltilmiş bazda)\n" +
            "2. **Pay Sınıfları ve Haklar** — Her sınıf için: oy hakları, temettü hakları, tasfiye önceliği, dönüşüm veya geri alma özellikleri\n" +
            "3. **Yönetim Kurulu Yapısı ve Yönetişim** — Yönetim kurulu büyüklüğü, yönetici atama hakları (ve bunları korumak için gereken pay sahipliği eşikleri), toplantı yeter sayısı ve başkanın üstün oyu\n" +
            "4. **Özel Onaya Tabi Konular** — Özel çoğunluk, oybirliği veya belirli bir pay sahibinin onayını gerektiren kararlar; her biri için eşik ve kimin onayının gerektiğini belirt\n" +
            "5. **Yeni Paylarda Ön Alım Hakkı** — Ön alım hakkına kimlerin sahip olduğu, prosedür, zaman çizelgesi ve istisnalar (örn. çalışan opsiyon planları)\n" +
            "6. **Devir Kısıtlamaları** — Kilitlenme süreleri, yasaklanan devirler, izin verilen devirler (örn. bağlı şirketlere) ve yönetim kurulu veya pay sahibi onayı şartları\n" +
            "7. **İlk Ret Hakkı / Devirde Ön Alım** — Tetikleyici olay, prosedür, fiyatlandırma mekanizması ve istisnalar\n" +
            "8. **Sürükleme Hakları** — Hakkın kimde olduğu, tetikleme eşiği, koşullar (örn. asgari fiyat, bağımsız değerleme) ve azınlık korumaları\n" +
            "9. **Katılma Hakları** — Hakkın kimde olduğu, tetikleyici eşik, kullanım prosedürü ve fiyat şartları\n" +
            "10. **Seyrelme Karşıtı Korumalar** — Türü (full ratchet, ağırlıklı ortalama), tetikleyici olaylar, hesaplama mekanizması ve istisnalar\n" +
            "11. **Temettü Politikası** — Temettü ödeme yükümlülüğü veya hedefi, imtiyazlı temettü hakları ve dağıtım kısıtlamaları\n" +
            "12. **Çıkış ve Likidite** — Kararlaştırılmış çıkış yolları (ticari satış, halka arz, sürükleme satışı), zaman çizelgeleri ve çıkışta tasfiye öncelikleri\n" +
            "13. **Çıkmaz** — Çıkmaz tanımı, eskalasyon ve çözüm mekanizmaları (örn. Russian roulette, put/call opsiyonları) ve çözülemezse sonuçları\n" +
            "14. **Rekabet Etmeme ve Müşteri/Personel Kaçırmama** — Kimin bağlı olduğu, faaliyet ve coğrafya kapsamı, süre ve istisnalar\n" +
            "15. **Uygulanacak Hukuk ve Uyuşmazlık Çözümü** — Uygulanacak hukuk, forum, tahkim veya dava yolu ve zorunlu eskalasyon adımları\n\n" +
            "Özeti indirilebilir bir Word dokümanı olarak oluştur.",
        columns_config: null,
    },

    // ─── Shareholder Agreement ────────────────────────────────────────────────────
    {
        id: "builtin-shareholder-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Hissedarlık sözleşmesi incelemesi",
        type: "tabular",
        practice: "Şirketler Hukuku",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Taraflar",
                format: "bulleted_list",
                prompt: "Bu hissedarlık sözleşmesinin tüm taraflarını belirle. Her biri için tam ticaret unvanını/adını, kuruluş veya yerleşim ülkesini (belirtilmişse) ve rolünü belirt (örn. şirket, çoğunluk pay sahibi, azınlık pay sahibi, yatırımcı, kurucu, yönetici pay sahibi).",
            },
            {
                index: 1,
                name: "Tarih",
                format: "date",
                prompt: "Bu hissedarlık sözleşmesinin tarihi nedir?",
            },
            {
                index: 2,
                name: "Sermaye ve pay sınıfları",
                format: "bulleted_list",
                prompt: "Bu sözleşmede mevcut olan veya öngörülen pay sınıfları nelerdir? Her sınıf için oy hakları, temettü hakları, varsa tasfiye önceliği ve dönüşüm veya geri alma özellikleri dahil temel hakları açıkla.",
            },
            {
                index: 3,
                name: "Pay sahiplikleri",
                format: "bulleted_list",
                prompt: "Bu sözleşmede düzenlenen veya öngörülen şekilde her tarafın pay sahipliği nedir? Her pay sahibi için sahip olduğu pay sayısını, sınıfını ve toplam sermaye içindeki yüzdesini belirt (belirtilmişse tam seyreltilmiş bazda).",
            },
            {
                index: 4,
                name: "Yönetim kurulu yapısı",
                format: "text",
                prompt: "Bu sözleşme kapsamında yönetim kurulu nasıl oluşturulur? Toplam yönetici sayısını, her pay sahibinin veya pay sahibi sınıfının yönetici atama ya da aday gösterme hakkını (ve bu hakkı korumak için gereken pay sahipliği eşiğini) ve başkan veya üstün oy hükümlerini belirt.",
            },
            {
                index: 5,
                name: "Özel onaya tabi konular",
                format: "bulleted_list",
                prompt: "Bu sözleşmede yer alan özel onaya tabi konular veya veto hakları nelerdir? Olağan çoğunluğun ötesinde pay sahibi veya yönetici onayı gerektiren her konuyu listele (örn. özel çoğunluk, oybirliği veya belirli bir pay sahibinin onayı). Her biri için uygulanacak eşiği veya kimin onayının gerektiğini belirt.",
            },
            {
                index: 6,
                name: "Yeni paylarda ön alım hakkı",
                format: "text",
                prompt: "Yeni pay ihracında hangi ön alım hakları uygulanır? Ön alım hakkının kimde olduğunu, yeni payların mevcut pay sahiplerine sunulma prosedürünü, kabul süresini ve istisnaları açıkla (örn. çalışan opsiyon planı kapsamında çıkarılan paylar, izin verilen ihraçlar).",
            },
            {
                index: 7,
                name: "Devir kısıtlamaları",
                format: "text",
                prompt: "Pay devrine hangi kısıtlamalar uygulanır? Kilitlenme sürelerini (ve sürelerini), tamamen yasaklanan devirleri ve onaysız izin verilen devirleri belirle (örn. bağlı şirketlere veya aile trust'larına devir). Devirler için yönetim kurulu veya pay sahibi onayı gerekip gerekmediğini not et.",
            },
            {
                index: 8,
                name: "Öncelikli satın alma hakkı / devirde ön alım",
                format: "text",
                prompt: "Önerilen pay devrinde ilk ret hakkı veya ön alım hakkı var mı? Varsa hakkın kimde olduğunu, tetikleme ve kullanım prosedürünü (bildirim süreleri ve fiyatlandırma mekanizması dahil) ve istisnaları açıkla.",
            },
            {
                index: 9,
                name: "Sürükleme hakları",
                format: "text",
                prompt: "Sürükleme hakları var mı? Varsa sürükleme hakkının kimde olduğunu (örn. belirli bir eşiğin üzerindeki çoğunluk pay sahipleri), hakkı tetiklemek için gereken eşiği, sürüklenen pay sahiplerine yüklenen yükümlülükleri, sürükleme koşullarını (örn. asgari fiyat, bağımsız değerleme) ve azınlık pay sahiplerine sağlanan korumaları belirt.",
            },
            {
                index: 10,
                name: "Katılma hakları",
                format: "text",
                prompt: "Katılma hakları var mı? Varsa hakkın kimde olduğunu, hakkı tetikleyen devir eşiğini, kullanım prosedürünü (bildirim süreleri dahil), katılan pay sahibinin hangi fiyat ve şartlarla satış yapabileceğini ve istisnaları belirt.",
            },
            {
                index: 11,
                name: "Seyrelme karşıtı korumalar",
                format: "text",
                prompt: "Herhangi bir pay sahibi sınıfı için seyrelme karşıtı korumalar var mı? Varsa koruma türünü (örn. full ratchet, ağırlıklı ortalama, geniş bazlı veya dar bazlı), tetikleyici olayları, ayarlanmış fiyatın veya hakkın nasıl hesaplandığını ve istisnaları açıkla (örn. hesaplama dışında bırakılan izin verilen ihraçlar).",
            },
            {
                index: 12,
                name: "Temettü politikası",
                format: "text",
                prompt: "Bu sözleşmede hangi temettü hükümleri yer alıyor? Temettü ödeme yükümlülüğü veya politikasını (örn. dağıtılabilir kârın asgari yüzdesi), belirli bir pay sınıfına bağlı imtiyazlı temettü haklarını ve temettü ödemelerine ilişkin kısıtlamaları açıkla (örn. dağıtılabilir kâr bulunması, yönetim kurulu veya pay sahibi onayı, kredi veren onayı).",
            },
            {
                index: 13,
                name: "Çıkış ve likidite hükümleri",
                format: "text",
                prompt: "Hangi çıkış veya likidite hükümleri yer alıyor? Kararlaştırılmış çıkış mekanizmalarını (örn. ticari satış, halka arz, sürükleme satışı), hedeflenen çıkış zaman çizelgelerini veya kilometre taşlarını, belirli bir süreden sonra çıkış sürecini başlatma veya zorlama haklarını ve çıkış gelirleri üzerinde belirli bir pay sınıfına tanınan öncelikleri açıkla.",
            },
            {
                index: 14,
                name: "Çıkmaz",
                format: "text",
                prompt: "Çıkmaz durumları nasıl ele alınıyor? Çıkmaz çözüm mekanizmalarını açıkla (örn. üst yönetime eskalasyon, arabuluculuk, Russian roulette / shoot-out hükümleri, put/call opsiyonları). Her mekanizma için tetikleyici koşulları, prosedürü ve çıkmaz çözülemezse sonuçları belirt.",
            },
            {
                index: 15,
                name: "Rekabet etmeme ve müşteri/personel kaçırmama",
                format: "text",
                prompt: "Herhangi bir pay sahibi rekabet etmeme veya müşteri/personel kaçırmama yükümlülüklerine tabi mi? Varsa hangi pay sahiplerinin bağlı olduğunu, kısıtlamanın kapsamını (faaliyetler ve coğrafya) ve süresini belirt (sözleşme süresince ve/veya pay sahipliği sona erdikten sonraki dönem). İstisnaları not et.",
            },
            {
                index: 16,
                name: "Gizlilik",
                format: "text",
                prompt: "Pay sahiplerine hangi gizlilik yükümlülükleri getiriliyor? Kapsama giren gizli bilgi alanını, izin verilen açıklamaları (örn. profesyonel danışmanlara, bağlı şirketlere, kredi verenlere) ve yükümlülüğün süresini belirt. Yükümlülüğün sözleşmenin sona ermesinden sonra devam edip etmediğini not et.",
            },
            {
                index: 17,
                name: "Garantiler",
                format: "text",
                prompt: "Bu sözleşme kapsamında pay sahipleri hangi garantileri veriyor? Garantileri kimin verdiğini, konusunu (örn. payların mülkiyeti, yetki, takyidat bulunmaması, çatışma olmaması), garanti taleplerine ilişkin sınırlamaları (örn. süre sınırları, üst sınırlar, bilgiye dayalı sınırlamalar) ve garantilerle birlikte verilen tazmin taahhütlerini belirt.",
            },
            {
                index: 18,
                name: "Uygulanacak hukuk",
                format: "text",
                prompt: "Bu sözleşmeye hangi hukuk uygulanır? Yetki alanını ve atıf yapılan özel hukuk sistemini belirt.",
            },
            {
                index: 19,
                name: "Uyuşmazlık çözümü",
                format: "text",
                prompt: "Bu sözleşme kapsamında uyuşmazlıklar nasıl çözülür? Uyuşmazlıkların mahkemeye mi tahkime mi gideceğini, seçilen forumu veya tahkim yerini, zorunlu eskalasyon adımlarını ve yetkinin münhasır olup olmadığını belirt.",
            },
        ],
    },

    // ─── Employment Agreement ─────────────────────────────────────────────────────
    {
        id: "builtin-employment-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "İş sözleşmesi incelemesi",
        type: "tabular",
        practice: "İş Hukuku",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "İşveren",
                format: "text",
                prompt: "Bu sözleşme kapsamında işveren kimdir? Tam ticaret unvanını/adını ve kuruluş veya yerleşim ülkesini belirt.",
            },
            {
                index: 1,
                name: "Çalışan",
                format: "text",
                prompt: "Bu sözleşme kapsamında çalışan kimdir? Tam adını ve verilmişse adresini veya konumunu belirt.",
            },
            {
                index: 2,
                name: "Tarih",
                format: "date",
                prompt: "Bu iş sözleşmesinin tarihi nedir? İşe başlama veya başlangıç tarihi imza tarihinden farklıysa ikisini de belirt.",
            },
            {
                index: 3,
                name: "Unvan",
                format: "text",
                prompt: "Bu sözleşmede çalışanın görev unvanı veya pozisyonu nedir? Raporlama hattı belirtilmişse onu da ekle.",
            },
            {
                index: 4,
                name: "Ücret",
                format: "text",
                prompt: "Bu sözleşme kapsamında çalışanın ücreti nedir? Temel maaşı veya ücreti, para birimini ve ödeme sıklığını belirt (örn. aylık, iki haftada bir). Garanti bonus, komisyon veya diğer sabit ücret unsurlarını dahil et.",
            },
            {
                index: 5,
                name: "Tam zamanlı / yarı zamanlı",
                format: "tag",
                tags: ["Tam zamanlı", "Yarı zamanlı"],
                prompt: "Bu pozisyon tam zamanlı mı yoksa yarı zamanlı mı? Yarı zamanlıysa belirtilmişse haftalık gün veya saat sayısını belirt.",
            },
            {
                index: 6,
                name: "Bağımsız yüklenici mi?",
                format: "yes_no",
                prompt: "Sözleşme çalışanı işçi yerine bağımsız yüklenici olarak mı nitelendiriyor? Sözleşmede yüklenici, danışman veya serbest çalışan dili kullanılıyorsa Evet yanıtını ver. İlişkinin niteliğini düzenleyen hükümleri not et.",
            },
            {
                index: 7,
                name: "Yan haklar",
                format: "bulleted_list",
                prompt: "Çalışan bu sözleşme kapsamında hangi yan haklara sahiptir? Her yan hakkı listele (örn. sağlık sigortası, emeklilik katkıları, hayat sigortası, araç yardımı, pay opsiyonları, gider iadesi). Uygunluk koşulları veya sınırlar varsa not et.",
            },
            {
                index: 8,
                name: "Bildirim süresi (işverenden çalışana)",
                format: "text",
                prompt: "İşveren, haklı neden dışında çalışanın iş ilişkisini sona erdirmek için hangi bildirimi yapmalıdır? Bildirim süresini ve bildirim yerine ödeme hükümlerini belirt.",
            },
            {
                index: 9,
                name: "Bildirim süresi (çalışandan işverene)",
                format: "text",
                prompt: "Çalışan istifa etmek için hangi bildirimi yapmalıdır? Bildirim süresini ve bildirim yerine ödeme veya garden leave hükümlerini belirt.",
            },
            {
                index: 10,
                name: "Fazla mesai",
                format: "text",
                prompt: "Fazla mesaiye hangi hükümler uygulanır? Çalışan fazla mesai ücretine hak kazanıyor mu; kazanıyorsa hangi oranda? Yoksa sözleşme maaşın fazla mesaiyi de kapsadığını mı söylüyor? Kanuni çalışma süresi sınırlarından feragat/opt-out varsa not et.",
            },
            {
                index: 11,
                name: "Çalışma saatleri",
                format: "text",
                prompt: "Bu sözleşmede hangi çalışma saatleri belirtilmiş? Normal çalışma saatlerini, esneklik hükümlerini ve çalışanın gerektiğinde ek saatler çalışmasının beklenip beklenmediğini belirt.",
            },
            {
                index: 12,
                name: "Değişiklik",
                format: "text",
                prompt: "Bu sözleşme şartlarının değiştirilmesini hangi hükümler düzenler? İşveren şartları tek taraflı değiştirebilir mi, yoksa çalışanın onayı gerekir mi? Onay olmadan değiştirilebileceği belirtilen özel şartları not et.",
            },
            {
                index: 13,
                name: "Fikri mülkiyet devri",
                format: "text",
                prompt: "Hangi fikri mülkiyet devri hükümleri yer alıyor? Çalışan, çalışma sırasında oluşturduğu tüm fikri mülkiyet haklarını işverene devrediyor mu? Önceden mevcut fikri mülkiyet veya çalışma saatleri dışında geliştirilen buluşlar için istisnalar var mı? Manevi haklardan feragat varsa not et.",
            },
            {
                index: 14,
                name: "Fesih nedenleri",
                format: "bulleted_list",
                prompt: "Sözleşmede derhâl fesih veya haklı nedenle fesih için hangi nedenler düzenlenmiş? Her nedeni listele (örn. ağır suistimal, gizlilik ihlali, aciz hâli, ceza mahkûmiyeti). Derhâl feshin bildirimsiz veya bildirim yerine ödeme yapılmaksızın olup olmadığını not et.",
            },
            {
                index: 15,
                name: "Yıllık izin hakkı",
                format: "text",
                prompt: "Çalışanın yıllık izin hakkı nedir? Yıllık gün (veya hafta) sayısını, resmi tatillerin buna dahil mi yoksa ek mi olduğunu ve izin birikimi, devri veya fesihte kullanılmayan izinlerin ödenmesine ilişkin hükümleri belirt.",
            },
        ],
    },
];

export const BUILT_IN_IDS = new Set(BUILT_IN_WORKFLOWS.map((wf) => wf.id));
