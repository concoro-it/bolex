export const BUILTIN_WORKFLOWS: { id: string; title: string; prompt_md: string }[] = [
    {
        id: "builtin-cp-checklist",
        title: "CP Kontrol Listesi Oluştur",
        prompt_md:
            "## Koşul Önceliği (CP) Kontrol Listesi Oluştur\n\n" +
            "Yüklenen kredi sözleşmesini veya finansman dokümanını incele ve kapsamlı bir Koşul Önceliği (CP) kontrol listesi oluştur.\n\n" +
            "Kontrol listesini indirilebilir bir Word dokümanı olarak üretmek için `generate_docx` aracını KULLANMALISIN. `generate_docx` aracına `landscape: true` göndermelisin - doküman yatay olmalıdır. Kontrol listesini ekranda gösterme - .docx dosyasını üret ve indirme bağlantısını sağla.\n\n" +
            "Dokümanı şu şekilde yapılandır:\n" +
            "- Her koşul kategorisi için (ör. Kurumsal, Finansal, Hukuki, Teminat) bir başlıklı bölüm ekle\n" +
            "- Her kategori başlığının altında tam olarak şu dört sütunu bu sırayla içeren bir tablo kullan:\n" +
            "  1. Index — kategori içindeki sıralı numara (1, 2, 3…)\n" +
            "  2. Clause Number — sözleşmedeki madde veya ek referansı\n" +
            "  3. Clause — koşul öncesi şartın kısa açıklaması\n" +
            "  4. Status — kullanıcının doldurması için boş bırak (boş string)\n\n" +
            "Her kategori satırı için section nesnesindeki table alanını (content değil) kullan.\n\n" +
            "Sonlandırmadan önce her tablonun doğru biçimlendirildiğini tekrar kontrol et: her tabloda yukarıdaki dört sütun aynı sırayla bulunmalı, başlıklar birebir aynı olmalı (Index, Clause Number, Clause, Status), her satır başlıklarla aynı sayıda hücre içermeli, Index sütunu her kategori içinde 1'den başlayarak sırayla gitmeli ve hiçbir hücrede fazladan markdown, satır sonu veya yer tutucu metin olmamalı (Status için boş string kullan).",
    },
    {
        id: "builtin-credit-summary",
        title: "Kredi Sözleşmesi Özeti",
        prompt_md:
            "## Kredi Sözleşmesi Özeti\n\n" +
            "Yüklenen kredi sözleşmesini incele ve aşağıdaki başlıkları kapsayan kapsamlı bir hukuki özet üret. " +
            "Her bölüm için temel hükümleri belirle, ilgili madde veya ek referanslarını alıntıla ve alışılmadık, ağır veya piyasa dışı şartları işaretle.\n\n" +
            "1. **Lenders** — Tüm lender'lar veya lender sendikasının üyeleri, tam hukuki unvanları ve rolleri (ör. mandated lead arranger, original lender, agent bank)\n" +
            "2. **Borrowers** — Tüm borrower'lar, tam hukuki unvanları ve kuruluş yargı çevreleri\n" +
            "3. **Guarantors** — Tüm guarantor'lar, tam hukuki unvanları ve garanti yükümlülüklerinin kapsamı\n" +
            "4. **Other Parties** — Diğer tüm önemli taraflar (ör. facility agent, security agent, hedge counterparties, issuing bank) ve rolleri\n" +
            "5. **Date of Agreement** — Kredi sözleşmesinin tarihi\n" +
            "6. **Facilities** — Mevcut her facility (ör. Revolving Credit Facility, Term Loan A, Term Loan B, Term Loan C), facility türü, tranche adı ve temel yapısal özellikler\n" +
            "7. **Amount** — Tüm facility'ler için toplam taahhüt tutarı, para birimi ve varsa tranche bazlı dağılım\n" +
            "8. **Purpose** — Borçlanmanın hangi amaçla kullanılabileceği ve fon kullanımına ilişkin kısıtlamalar\n" +
            "9. **Interest** — Uygulanan referans oran (ör. SOFR, EURIBOR, base rate), marj, varsa marj ratchet mekanizması ve faiz dönemlerinin yapısı\n" +
            "10. **Commitment Fee** — Commitment veya utilisation ücretleri, uygulanan oran, hesaplanma şekli ve dayanak (ör. kullanılmayan taahhüt, ortalama kullanım)\n" +
            "11. **Repayment Schedule** — Her facility için geri ödeme profili, taksitli veya bullet geri ödeme olup olmadığı, ödeme tarihleri ve tutarları\n" +
            "12. **Maturity** — Her facility için nihai vade tarihi\n" +
            "13. **Security** — Verilen veya istenen her teminat türü (ör. share pledge, fixed ve floating charge, taşınmaz ipoteği, hesap rehni) ve teminat altına alınan varlıklar veya kişiler\n" +
            "14. **Guarantees** — Garanti yükümlülükleri, guarantor'lar, garantinin kapsamı ve varsa sınırlamalar (ör. up-stream garanti sınırlaması, guarantor coverage test)\n" +
            "15. **Financial Covenants** — Her finansal covenant, ölçüt (ör. leverage ratio, interest cover, cashflow cover), ilgili test, test sıklığı ve varsa equity cure hakları\n" +
            "16. **Events of Default** — Her temerrüt olayı, varsa grace period, önemlilik eşiği veya cross-default hükümleri\n" +
            "17. **Assignment** — Devir veya transfer üzerindeki kısıtlamalar ya da izinler (ör. white/blacklist, lender transferleri için borrower onayı; borrower assignment kısıtları)\n" +
            "18. **Change of Control** — Change of control sayılan haller, doğurduğu yükümlülükler (ör. zorunlu erken ödeme, iptal, lender onayı) ve varsa cure period\n" +
            "19. **Prepayment Fee** — Erken ödeme ücretleri, make-whole primleri veya soft-call korumaları; uygulanacak ücret, geçerli olduğu dönem ve istisnalar (ör. sigorta geliri veya varlık satışı kaynaklı erken ödeme)\n" +
            "20. **Governing Law** — Sözleşmenin tabi olduğu hukuk\n" +
            "21. **Dispute Resolution** — Uyuşmazlıkların dava mı tahkim mi yoluyla çözüleceği, seçilen forum/seat ve yetki kabulü hükümleri\n\n" +
            "Özeti sohbet yanıtında doğrudan ver - `generate_docx` çağırma. Yalnızca kullanıcı açıkça isterse indirilebilir Word dokümanı üret.",
    },
    {
        id: "builtin-sha-summary",
        title: "Hissedar Sözleşmesi Özeti",
        prompt_md:
            "## Hissedar Sözleşmesi Özeti\n\n" +
            "Yüklenen hissedar sözleşmesini incele ve aşağıdaki başlıkları kapsayan kapsamlı bir hukuki özet üret. " +
            "Her bölüm için temel hükümleri belirle, ilgili madde referanslarını alıntıla ve alışılmadık, ağır veya piyasa standardından sapmaları işaretle.\n\n" +
            "1. **Parties & Shareholdings** — Tam hukuki unvanlar, roller, elde tutulan pay sınıfları ve yüzde paylar (belirtilmişse fully diluted bazda)\n" +
            "2. **Share Classes & Rights** — Her sınıf için oy hakları, temettü hakları, likidasyon önceliği, dönüşüm veya itfa özellikleri\n" +
            "3. **Board Composition & Governance** — Yönetim kurulu büyüklüğü, yönetici atama hakları (ve bunları korumak için gereken pay sahipliği eşikleri), toplantı yeter sayısı ve eşitlik bozucu oy\n" +
            "4. **Reserved Matters** — Özel çoğunluk, oybirliği veya belirli bir hissedarın onayı gerektiren kararlar; her biri için eşik ve gereken onayı belirt\n" +
            "5. **Pre-emption on New Shares** — Ön alım hakkına kimin sahip olduğu, prosedür, süre ve istisnalar (ör. çalışan opsiyon planları)\n" +
            "6. **Transfer Restrictions** — Kilitli kalma süreleri, yasak transferler, izinli transferler (ör. bağlı ortaklıklara) ve varsa kurul/hissedar onayı gereklilikleri\n" +
            "7. **Right of First Refusal / Pre-emption on Transfer** — Tetikleyici, prosedür, fiyatlama mekaniği ve istisnalar\n" +
            "8. **Drag-Along Rights** — Hakkın kime ait olduğu, tetiklenme eşiği, koşullar (ör. asgari fiyat, bağımsız değerleme) ve azınlık korumaları\n" +
            "9. **Tag-Along Rights** — Hakkın kime ait olduğu, tetiklenme eşiği, kullanma prosedürü ve fiyat şartları\n" +
            "10. **Anti-Dilution Protections** — Türü (full ratchet, weighted average), tetikleyici olaylar, hesaplama mekaniği ve istisnalar\n" +
            "11. **Dividend Policy** — Temettü ödeme yükümlülüğü veya hedefi, tercihli temettü hakları ve dağıtım kısıtlamaları\n" +
            "12. **Exit & Liquidity** — Kabul edilen çıkış yolları (trade sale, IPO, drag sale), süreler ve çıkışta likidasyon öncelikleri\n" +
            "13. **Deadlock** — Deadlock tanımı, eskalasyon ve çözüm mekanizmaları (ör. Russian roulette, put/call opsiyonları) ve çözümsüz kalırsa sonuçlar\n" +
            "14. **Non-Compete & Non-Solicitation** — Kimlerin bağlı olduğu, faaliyet kapsamı ve coğrafya, süre ve istisnalar\n" +
            "15. **Governing Law & Dispute Resolution** — Uygulanacak hukuk, forum, tahkim veya dava yolu ve zorunlu eskalasyon adımları\n\n" +
            "Özeti indirilebilir Word dokümanı olarak oluştur.",
    },
    {
        id: "builtin-hukuk-asistani",
        title: "Hukuk Asistanı",
        prompt_md:
            "## Hukuk Asistanı\n\n" +
            "Kullanıcının hukuki talebini analiz et, niyetini belirle ve en uygun çalışma akışını kur. " +
            "Talep araştırma, içtihat bulma, mevzuat kontrolü, belge analizi, dilekçe hazırlama, sözleşme hazırlama veya madde üretimi gerektirebilir.\n\n" +
            "Önce talebi şu başlıklara ayır:\n" +
            "1. **Talep Türü** — Araştırma, analiz, taslak üretimi, revizyon, özetleme veya strateji\n" +
            "2. **Hukuk Alanı** — Borçlar, ticaret, iş, icra, aile, kira, tüketici, idare, ceza veya diğer\n" +
            "3. **Gerekli Kaynaklar** — Mevzuat, içtihat, kullanıcının yüklediği belge veya kullanıcıdan gereken bilgiler\n" +
            "4. **Önerilen Tool Zinciri** — Hangi araçların hangi sırayla kullanılacağını belirt\n" +
            "5. **Eksik Bilgiler** — Sonuç üretmek için zorunlu olan eksik bilgileri sor\n\n" +
            "Eğer yeterli bilgi varsa doğrudan çalışmaya başla. Gereksiz açıklama yapma. Varsayım yapman gerekirse bunu açıkça belirt. " +
            "Türk hukuku dışındaki hukuk sistemlerine göre kesin değerlendirme yapma. Kaynaksız hukuki iddia üretme.",
    },
    {
        id: "builtin-mevzuat-bul",
        title: "Mevzuat Bul",
        prompt_md:
            "## Mevzuat Bul\n\n" +
            "Kullanıcının sorduğu hukuki konuya ilişkin ilgili kanun, yönetmelik, tebliğ, genelge, madde ve yürürlük bilgisini araştır.\n\n" +
            "Varsa mevzuat_bul aracını kullan. Güncel yürürlük durumunu ve madde metnini kontrol et. " +
            "Kaynaksız madde numarası veya hüküm uydurma.\n\n" +
            "Yanıtı şu yapıda ver:\n" +
            "1. **İlgili Mevzuat** — Mevzuat adı, kanun/yönetmelik numarası ve ilgili maddeler\n" +
            "2. **Hükmün Özeti** — Maddenin pratik anlamı\n" +
            "3. **Yürürlük / Güncellik Notu** — Bulunabiliyorsa yürürlük durumu\n" +
            "4. **Uygulanabilirlik** — Kullanıcının olayına nasıl uygulanabileceği\n" +
            "5. **Dikkat Edilecek Noktalar** — İstisnalar, süreler, şekil şartları veya riskler\n\n" +
            "Çıktıyı sade, teknik ve Markdown formatında üret.",
    },
    {
        id: "builtin-ictihat-bul",
        title: "İçtihat Bul",
        prompt_md:
            "## İçtihat Bul\n\n" +
            "Kullanıcının hukuki sorusuna ilişkin Yargıtay, Danıştay, Anayasa Mahkemesi, UYAP Emsal veya diğer erişilebilir içtihat kaynaklarından karar araştır.\n\n" +
            "Varsa ictihat_bul aracını kullan. Arama yaparken önce hukuki problemi, sonra anahtar kavramları, sonra mahkeme türünü belirle. " +
            "Karar bulamazsan bunu açıkça söyle; karar varmış gibi davranma.\n\n" +
            "Yanıtı şu yapıda ver:\n" +
            "1. **Arama Stratejisi** — Kullanılan hukuki kavramlar ve filtreler\n" +
            "2. **Bulunan Kararlar** — Mahkeme, daire/kurul, esas no, karar no, tarih ve konu\n" +
            "3. **Kısa Hukuki Sonuç** — Her kararın ortaya koyduğu ilke\n" +
            "4. **Kullanıcının Olayına Etkisi** — Kararların lehe/aleyhe yönleri\n" +
            "5. **Sonraki Adım** — Gerekirse karar_getir veya emsal_ozetle aracıyla detaylandırma öner\n\n" +
            "Karar künyelerini mümkün olduğunca eksiksiz ver. Emin olmadığın künye bilgisini kesin bilgi gibi yazma.",
    },
    {
        id: "builtin-karar-getir",
        title: "Karar Getir",
        prompt_md:
            "## Karar Getir\n\n" +
            "Kullanıcının belirttiği veya daha önceki aramada bulunan spesifik mahkeme kararını tam metin veya okunabilir Markdown formatında getir.\n\n" +
            "Varsa karar_getir aracını kullan. Karar kimliği, esas no, karar no, tarih, mahkeme veya kaynak bilgisi verilmişse bunları arama parametresi olarak kullan.\n\n" +
            "Yanıtı şu yapıda ver:\n" +
            "1. **Karar Künyesi** — Mahkeme, daire/kurul, esas no, karar no, tarih\n" +
            "2. **Tam Metin veya İlgili Bölüm** — Kararın erişilebilen metni\n" +
            "3. **Hukuki İlke** — Karardan çıkan temel sonuç\n" +
            "4. **Notlar** — Eksik metin, erişim kısıtı veya doğrulanamayan alan varsa belirt\n\n" +
            "Karar metni bulunamazsa alternatif benzer kararlar uydurma; yalnızca bulunamadığını ve hangi bilgilerin gerektiğini söyle.",
    },
    {
        id: "builtin-emsal-ozetle",
        title: "Emsal Özetle",
        prompt_md:
            "## Emsal Özetle\n\n" +
            "Kullanıcının verdiği veya araçlarla bulunan mahkeme kararlarını kısa hukuki sonuç, gerekçe ve uygulanabilirlik açısından özetle.\n\n" +
            "Eğer karar listesi varsa her kararı ayrı değerlendir. Eğer karar metni eksikse bunu belirt ve kesin sonuç çıkarmaktan kaçın.\n\n" +
            "Her karar için şu yapıyı kullan:\n" +
            "1. **Künye** — Mahkeme, daire/kurul, esas no, karar no, tarih\n" +
            "2. **Uyuşmazlık Konusu** — Kararın hangi hukuki problemi çözdüğü\n" +
            "3. **Hukuki Sonuç** — Mahkemenin benimsediği ilke\n" +
            "4. **Gerekçe** — Mahkemenin sonuca neden böyle ulaştığı\n" +
            "5. **Uygulanabilirlik** — Kullanıcının olayına ne ölçüde uygulanabileceği\n" +
            "6. **Lehe/Aleyhe Değerlendirme** — Kullanıcı açısından olası etkisi\n\n" +
            "Son bölümde kararlar arasında çelişki, yerleşik içtihat veya istisna olup olmadığını ayrıca belirt.",
    },
    {
        id: "builtin-dilekce-hazirla",
        title: "Dilekçe Hazırla",
        prompt_md:
            "## Dilekçe Hazırla\n\n" +
            "Kullanıcının talebine göre dava dilekçesi, cevap dilekçesi, itiraz dilekçesi, istinaf, temyiz, ihtarname veya başvuru metni hazırla.\n\n" +
            "Önce dilekçe türünü, görevli/yetkili merciyi, tarafları, olayları, talepleri, süreleri ve delilleri kontrol et. " +
            "Gerekli bilgiler eksikse en fazla 5 net soru sor. Yeterli bilgi varsa taslak üret.\n\n" +
            "Taslağı şu yapıda üret:\n" +
            "1. **Başlık / Merci**\n" +
            "2. **Taraf Bilgileri**\n" +
            "3. **Konu**\n" +
            "4. **Açıklamalar**\n" +
            "5. **Hukuki Nedenler**\n" +
            "6. **Deliller**\n" +
            "7. **Sonuç ve Talep**\n" +
            "8. **Ekler**\n\n" +
            "Gerçek taraf bilgisi yoksa köşeli parantezli placeholder kullan. Uydurma tarih, adres, T.C. kimlik no, mahkeme dosya no veya delil ekleme. " +
            "Metni resmi, sade ve Türk hukuk pratiğine uygun yaz.",
    },
    {
        id: "builtin-sozlesme-hazirla",
        title: "Sözleşme Hazırla",
        prompt_md:
            "## Sözleşme Hazırla\n\n" +
            "Kullanıcının verdiği ticari veya hukuki bağlama göre Türk hukukuna uygun sözleşme taslağı hazırla.\n\n" +
            "Önce sözleşme türünü, tarafları, edimleri, bedeli, süreyi, fesih koşullarını, cezai şartı, gizliliği, uyuşmazlık çözümünü ve özel riskleri belirle. " +
            "Eksik taraf veya işlem bilgileri için placeholder kullan.\n\n" +
            "Sözleşmeyi şu yapıda üret:\n" +
            "1. **Sözleşme Başlığı**\n" +
            "2. **Taraflar**\n" +
            "3. **Tanımlar**\n" +
            "4. **Konu ve Kapsam**\n" +
            "5. **Tarafların Hak ve Yükümlülükleri**\n" +
            "6. **Bedel ve Ödeme**\n" +
            "7. **Süre ve Fesih**\n" +
            "8. **Gizlilik ve Kişisel Veriler**\n" +
            "9. **Sorumluluk ve Cezai Şart**\n" +
            "10. **Mücbir Sebep**\n" +
            "11. **Bildirimler**\n" +
            "12. **Uygulanacak Hukuk ve Yetki**\n" +
            "13. **İmza Blokları**\n\n" +
            "Her placeholder'ı köşeli parantez içinde açık alan adıyla yaz. Kullanıcı özellikle istemedikçe Word belgesi üretme; metni düzenlenebilir Markdown olarak ver.",
    },
    {
        id: "builtin-madde-olustur",
        title: "Madde Oluştur",
        prompt_md:
            "## Madde Oluştur\n\n" +
            "Kullanıcının istediği sözleşme maddesini Türk hukukuna uygun, açık, uygulanabilir ve sözleşmeye eklenebilir şekilde hazırla.\n\n" +
            "Madde türü fesih, cezai şart, gizlilik, rekabet yasağı, ödeme, teslim, yetki, teminat, sorumluluk sınırı, KVKK veya başka bir hüküm olabilir.\n\n" +
            "Yanıtı şu yapıda ver:\n" +
            "1. **Madde Başlığı**\n" +
            "2. **Önerilen Madde Metni**\n" +
            "3. **Kısa Açıklama** — Maddenin neyi koruduğu ve hangi durumda kullanılacağı\n" +
            "4. **Risk Notu** — Aşırı genişlik, geçersizlik, hakkaniyet, tüketici/iş hukuku veya ispat riski varsa belirt\n" +
            "5. **Alternatif Formülasyon** — Gerekirse daha yumuşak veya daha güçlü bir versiyon öner\n\n" +
            "Metni doğrudan sözleşmeye yapıştırılabilir şekilde yaz. Uygulanamayacak kadar genel veya belirsiz hüküm üretme.",
    },
    {
        id: "builtin-belge-analiz-et",
        title: "Belge Analiz Et",
        prompt_md:
            "## Belge Analiz Et\n\n" +
            "Kullanıcının yüklediği belgeyi hukuki riskler, eksik bilgiler, çelişkiler, ağır hükümler ve madde bazlı iyileştirme önerileri açısından analiz et.\n\n" +
            "Belgeyi okumadan varsayım yapma. Belgedeki madde numaralarına ve başlıklara referans ver. " +
            "Belgede bulunmayan bir hükmü varmış gibi değerlendirme.\n\n" +
            "Analizi şu yapıda üret:\n" +
            "1. **Kısa Yönetici Özeti** — Belgenin genel risk seviyesi ve ana bulgular\n" +
            "2. **Eksik Bilgiler** — Taraf, tarih, bedel, süre, imza, ekler veya tanımlar gibi eksikler\n" +
            "3. **Çelişkiler** — Belge içindeki tutarsız hükümler\n" +
            "4. **Riskli Maddeler** — Madde numarası, risk açıklaması, risk seviyesi ve öneri\n" +
            "5. **Lehe Hükümler** — Kullanıcı açısından avantajlı hükümler\n" +
            "6. **Revizyon Önerileri** — Somut değişiklik önerileri\n" +
            "7. **Kontrol Listesi** — İmzadan önce kontrol edilmesi gereken noktalar\n\n" +
            "Risk seviyelerini Düşük, Orta, Yüksek olarak etiketle. Gerekirse tablo kullan. Çıktıyı Markdown formatında üret.",
    },
];
