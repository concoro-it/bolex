export const BUILTIN_WORKFLOWS: { id: string; title: string; prompt_md: string }[] = [
    {
        id: "builtin-cp-checklist",
        title: "Generate CP Checklist",
        prompt_md:
            "## Generate Conditions Precedent Checklist\n\n" +
            "Review the uploaded credit agreement or financing document and generate a comprehensive " +
            "Conditions Precedent (CP) checklist.\n\n" +
            "You MUST use the generate_docx tool to produce the checklist as a downloadable Word document. " +
            "You MUST pass landscape: true to the generate_docx tool — the document must be in landscape orientation. " +
            "Do not display the checklist inline — generate the .docx file and provide the download link.\n\n" +
            "Structure the document as follows:\n" +
            "- For each category of conditions (e.g. Corporate, Financial, Legal, Security), add a section with a heading\n" +
            "- Under each category heading, include a table with exactly these four columns in this order:\n" +
            "  1. Index — sequential number within the category (1, 2, 3…)\n" +
            "  2. Clause Number — the clause or schedule reference from the agreement\n" +
            "  3. Clause — a concise description of the condition precedent\n" +
            "  4. Status — leave blank (empty string) for the user to fill in\n\n" +
            "Use the table field in the section object (not content) for each category's rows.\n\n" +
            "Before finalizing, double-check that every table is formatted correctly: each table must have exactly the four columns above in the same order, headers must match exactly (Index, Clause Number, Clause, Status), every row must have the same number of cells as the headers, the Index column must be sequential starting from 1 within each category, and no cells should contain stray markdown, newlines, or placeholder text (use an empty string for Status).",
    },
    {
        id: "builtin-credit-summary",
        title: "Credit Agreement Summary",
        prompt_md:
            "## Credit Agreement Summary\n\n" +
            "Review the uploaded credit agreement and produce a comprehensive legal summary covering the following topics. " +
            "For each section, identify the key provisions, quote the relevant clause or schedule references, and flag any unusual, onerous, or non-market terms.\n\n" +
            "1. **Lenders** — All lenders or members of the lender syndicate, including their full legal name and role (e.g. mandated lead arranger, original lender, agent bank)\n" +
            "2. **Borrowers** — All borrowers, including their full legal name and jurisdiction of incorporation\n" +
            "3. **Guarantors** — All guarantors, including their full legal name and the scope of their guarantee obligation\n" +
            "4. **Other Parties** — Any other material parties (e.g. facility agent, security agent, hedge counterparties, issuing bank) and their roles\n" +
            "5. **Date of Agreement** — Date of the credit agreement\n" +
            "6. **Facilities** — Each facility available (e.g. Revolving Credit Facility, Term Loan A, Term Loan B, Term Loan C), the facility type, tranche name, and any key structural features\n" +
            "7. **Amount** — Total committed amount across all facilities, the currency, and breakdown by tranche if applicable\n" +
            "8. **Purpose** — Stated purpose for which borrowings may be used and any restrictions on use of proceeds\n" +
            "9. **Interest** — Applicable reference rate (e.g. SOFR, EURIBOR, base rate), the margin, any margin ratchet mechanism, and how interest periods are structured\n" +
            "10. **Commitment Fee** — Commitment or utilisation fees, the applicable rate, how they are calculated, and the basis (e.g. undrawn commitment, average utilisation)\n" +
            "11. **Repayment Schedule** — Repayment profile for each facility, whether by scheduled instalments or bullet repayment, and the repayment dates and amounts\n" +
            "12. **Maturity** — Final maturity date for each facility\n" +
            "13. **Security** — Each class of security granted or required (e.g. share pledges, fixed and floating charges, real estate mortgages, account pledges) and the assets or entities over which security is taken\n" +
            "14. **Guarantees** — Guarantee obligations, the guarantors, the scope of the guarantee, and any limitations (e.g. up-stream guarantee limitations, guarantor coverage test)\n" +
            "15. **Financial Covenants** — Each financial covenant, the metric (e.g. leverage ratio, interest cover, cashflow cover), the applicable test, testing frequency, and any equity cure rights\n" +
            "16. **Events of Default** — Each event of default, noting any grace periods, materiality thresholds, or cross-default provisions\n" +
            "17. **Assignment** — Restrictions or permissions on assignment or transfer (e.g. white/blacklists, borrower consent for lender transfers; restrictions on borrower assignment)\n" +
            "18. **Change of Control** — What constitutes a change of control, what obligations it triggers (e.g. mandatory prepayment, cancellation, lender consent), and any cure period\n" +
            "19. **Prepayment Fee** — Any prepayment fees, make-whole premiums, or soft-call protections, the applicable fee, the period during which it applies, and any exceptions (e.g. prepayment from insurance proceeds or asset disposals)\n" +
            "20. **Governing Law** — Governing law of the agreement\n" +
            "21. **Dispute Resolution** — Whether disputes go to litigation or arbitration, the chosen forum or seat, and any submission to jurisdiction provisions\n\n" +
            "Deliver the summary inline in your chat response — do NOT call generate_docx. Only produce a downloadable Word document if the user explicitly asks for one.",
    },
    {
        id: "builtin-sha-summary",
        title: "Shareholder Agreement Summary",
        prompt_md:
            "## Shareholder Agreement Summary\n\n" +
            "Review the uploaded shareholder agreement and produce a comprehensive legal summary covering the following topics. " +
            "For each section, identify the key provisions, quote the relevant clause references, and flag any unusual, onerous, or market-standard deviations.\n\n" +
            "1. **Parties & Shareholdings** — Full legal names, roles, share classes held, and percentage interests (on a fully diluted basis if stated)\n" +
            "2. **Share Classes & Rights** — For each class: voting rights, dividend rights, liquidation preference, conversion or redemption features\n" +
            "3. **Board Composition & Governance** — Board size, director appointment rights (and the shareholding thresholds required to maintain them), quorum, and casting vote\n" +
            "4. **Reserved Matters** — Decisions requiring a special majority, unanimity, or a specific shareholder's consent; note the threshold and whose consent is required for each\n" +
            "5. **Pre-emption on New Shares** — Who holds pre-emption rights, procedure, timeline, and any carve-outs (e.g. employee option schemes)\n" +
            "6. **Transfer Restrictions** — Lock-up periods, prohibited transfers, permitted transfers (e.g. to affiliates), and any board or shareholder approval requirements\n" +
            "7. **Right of First Refusal / Pre-emption on Transfer** — Trigger, procedure, pricing mechanics, and any exceptions\n" +
            "8. **Drag-Along Rights** — Who holds the right, threshold to trigger, conditions (e.g. minimum price, independent valuation), and minority protections\n" +
            "9. **Tag-Along Rights** — Who holds the right, triggering threshold, exercise procedure, and price terms\n" +
            "10. **Anti-Dilution Protections** — Type (full ratchet, weighted average), trigger events, calculation mechanics, and exceptions\n" +
            "11. **Dividend Policy** — Any obligation or target to pay dividends, preferential dividend rights, and restrictions on distributions\n" +
            "12. **Exit & Liquidity** — Agreed exit routes (trade sale, IPO, drag sale), timelines, and liquidation preferences on exit\n" +
            "13. **Deadlock** — Deadlock definition, escalation and resolution mechanisms (e.g. Russian roulette, put/call options), and consequences if unresolved\n" +
            "14. **Non-Compete & Non-Solicitation** — Who is bound, scope of activities and geography, duration, and carve-outs\n" +
            "15. **Governing Law & Dispute Resolution** — Applicable law, forum, arbitration or litigation, and any mandatory escalation steps\n\n" +
            "Generate the summary as a downloadable Word document.",
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
