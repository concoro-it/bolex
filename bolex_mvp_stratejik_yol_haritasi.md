# Bolex MVP Stratejik Yol Haritası

## 1. Yönetici kararı

Bolex MVP’nin ana iddiası şu olmalı:

**“Türk hukuku için doğrulanabilir kaynaklara dayalı, düzenlenebilir hukuki belge ve araştırma çalışma alanı.”**

Bu ürün şu anda sıfırdan başlamıyor. Repo’da zaten Next.js frontend, Express backend, Supabase, Tiptap tabanlı belge düzenleme, doküman versiyonlama, tracked edit mantığı, workflow sistemi, tabular review, Yargı MCP ve Mevzuat MCP route altyapısı var. Bu nedenle MVP stratejisi “daha fazla legal plugin eklemek” değil, mevcut parçaları tek ve güvenilir bir ürün akışına indirgemek olmalı.

MVP’de Bolex’in kazanacağı yer şurası:

Kullanıcı bir hukuki işi başlatır, Bolex önce doğru workflow’u seçtirir, gerekli mevzuat/yargı kaynaklarını doğrular, taslağı Tiptap editöre üretir, kaynakları ilgili belge bölümü üzerinde bağlamsal verification kartlarıyla gösterir, yapılan AI değişikliklerini verification event olarak kaydeder ve kullanıcı her değişikliği kabul/reddeder.

## 2. MVP için ürün pozisyonu

### Hedef kullanıcı

MVP’nin ana hedefi **avukat + stajyer avukat + hukuk bürosu içi junior ekip** olmalı.

Şirket kullanıcısı ve hukuk öğrencisi ikinci halkada tutulmalı. Çünkü MVP’de en güçlü pain şudur:

- Dosya okumak
- İlgili mevzuatı bulmak
- Güncel karar/emsal aramak
- Dilekçe veya sözleşme taslağı çıkarmak
- Taslağı elle düzenlemek
- Kaynağın gerçekten var olup olmadığını görmek

Bu pain en hızlı şekilde avukat/stajyer segmentinde para eder.

### Ürün vaadi

Bolex’in MVP cümlesi:

**“Bolex, Türk hukuku için kaynak gösteren AI çalışma alanıdır: araştırır, taslak üretir, belge üzerinde düzenletir ve her iddiayı doğrulama kaydıyla takip eder.”**

### Ne değildir?

Bolex MVP şu iddiaya girmemeli:

- “Avukat yerine hukuki tavsiye verir.”
- “Kesin sonucu söyler.”
- “Davayı kazanma ihtimali hesaplar.”
- “Kullanıcı adına hukuki karar alır.”
- “Kaynağı olmayan hukuki iddia üretir.”

MVP sınırı:

**“Hukuki tavsiye değil; kaynaklı araştırma, belge analizi, taslak ve revizyon desteği.”**

## 3. Mevcut repo’dan çıkan stratejik gerçekler

### Zaten var olan güçlü parçalar

1. **Assistant-first ürün yapısı**\
   Root route `/assistant` yönüne gidiyor. Ürünün ana ekranı chat/workspace merkezli kurgulanmış.

2. **Backend modüler route yapısı**\
   Chat, projects, project chat, documents, tabular review, workflows, user ve download route’ları ayrılmış. Bu, MVP’nin tek bir “legal workspace” olarak büyümesi için iyi bir temel.

3. **Tiptap/editör altyapısı**\
   Frontend paketlerinde Tiptap ve DOCX/PDF preview bağımlılıkları var. Bu Bolex’i salt chat ürününden ayıran ana fark.

4. **Doküman versiyonlama ve edit kayıtları**\
   Schema’da `document_versions`, `document_edits`, `current_version_id`, `assistant_edit`, `user_accept`, `user_reject`, `manual_edit`, `generated` gibi kaynak tipleri mevcut. Bu verification log için çok değerli.

5. **Workflow sistemi**\
   `workflows`, `workflow_shares`, `hidden_workflows` tabloları ve backend route’ları var. Bu, Claude for Legal plugin mantığını Bolex içinde “workflow template” olarak uygulamak için ideal.

6. **Tabular review sistemi**\
   Çoklu doküman karşılaştırma, due diligence, sözleşme matrisi ve dava dosyası analizi için ikinci fazda çok güçlü olabilir.

7. **Yargı MCP + Mevzuat MCP entegrasyonu**\
   Repo’da hem Yargı MCP hem Mevzuat MCP tool isimleri ve routing mantığı tanımlanmış. Bu, Bolex’i genel AI chat’ten ayıracak en kritik savunulabilir özellik.

### Henüz ürünleşmemiş riskler

1. MCP araçları var ama kullanıcıya kaynak kalitesi nasıl gösterilecek net değil.
2. Verification log teknik olarak mümkün ama UI/ürün akışı olarak MVP’ye bağlanmalı.
3. Workflow’lar var ama MVP için seçilecek workflow seti daraltılmalı.
4. MVP’de roller ürün deneyiminden bilinçli olarak çıkarılmalı; kullanıcı intent’leri üzerinden daha lineer bir akış kurulmalı.
5. AGPL/open-source pozisyonu ürün sayfası, repo notu ve SaaS paketlemesiyle uyumlu hale getirilmeli.
6. Hukuki tavsiye sınırı sadece footer/disclaimer değil, ürün davranışına gömülmeli.

## 4. MVP’ye alınması gereken Claude for Legal plugin mantıkları

MVP’ye sadece yüksek frekanslı, düşük entegrasyon karmaşıklıklı, Bolex’in farkını en net gösteren plugin mantıkları alınmalı.

### MVP-1: Kaynaklı hukuki araştırma workflow’u

**Amaç:** Kullanıcı bir hukuki soru sorar; Bolex önce mevzuatı, sonra gerekiyorsa yargı kararlarını arar ve kaynaklı cevap verir.

Örnek prompt:

“TBK’ya göre kira bedelinin uyarlanması şartları nelerdir? Güncel Yargıtay yaklaşımıyla açıkla.”

MVP davranışı:

1. Soru normatif mi içtihadi mi ayrıştırılır.
2. Mevzuat MCP ile kanun/madde aranır.
3. Yargı MCP ile karar/emsal aranır.
4. Cevapta her iddia kaynak kartına bağlanır.
5. Kaynak bulunamazsa açıkça “doğrulanamadı” denir.

Neden MVP’ye girmeli:

Bu, Bolex’in Türk hukuku farkını en hızlı gösteren özelliktir.

### MVP-2: Dilekçe / sözleşme / ihtarname taslak üretimi

**Amaç:** Kullanıcı hukuki belge ister; Bolex kaynaklı araştırma yaptıktan sonra Tiptap editöre düzenlenebilir taslak üretir.

Öncelikli belge tipleri:

- Ticari kira sözleşmesi
- Hissedarlık sözleşmesi
- İhtarname
- Arabuluculuk başvuru taslağı
- Basit dava dilekçesi
- Cevap dilekçesi iskeleti

MVP davranışı:

1. Belge tipi seçilir.
2. Gerekli alanlar placeholder olarak belirlenir.
3. İlgili mevzuat/emsal gerekiyorsa doğrulanır.
4. Tiptap editöre taslak üretilir.
5. Eksik alanlar placeholder chip olarak gösterilir.
6. Kullanıcı belge üzerinde elle veya AI ile revizyon yapar.

Neden MVP’ye girmeli:

Kullanıcı değeri “cevap almak” değil, “işe yarar belge çıkarmak”. Tiptap bu nedenle ana farktır.

### MVP-3: Belge inceleme ve risk analizi

**Amaç:** Kullanıcı bir sözleşme veya dava dosyası yükler; Bolex riskleri, eksik hükümleri ve revizyon önerilerini çıkarır.

MVP davranışı:

1. Doküman okunur.
2. Riskler önem seviyesine göre gruplanır.
3. Her risk dokümandaki ilgili alıntıya bağlanır.
4. Önerilen revizyonlar edit card olarak sunulur.
5. Kullanıcı kabul/reddeder.

Neden MVP’ye girmeli:

Repo’da doküman okuma, citation ve tracked edit mantığı zaten var. Bu özellik ürün farkını doğrudan gösterir.

### MVP-4: AI edit + kabul/reddet + versiyon geçmişi

**Amaç:** Bolex’in “chat üretir, editor düzeltir” ayrımını gerçek ürüne çevirmek.

MVP davranışı:

1. Kullanıcı “3. maddeyi daha güçlü yap” der.
2. AI sadece ilgili maddeye edit önerir.
3. Değişiklik pending olarak görünür.
4. Kullanıcı kabul/reddeder.
5. Version history güncellenir.
6. Verification log’a “kim/ne zaman/ne değiştirdi/neye dayanarak” kaydedilir.

Neden MVP’ye girmeli:

Bu, Bolex’i ChatGPT + Word kombinasyonundan ayıran temel ürün davranışı.

### MVP-5: Kaynak kartları ve verification log

**Amaç:** Kullanıcı AI cevabının hangi kaynağa dayandığını görebilsin.

MVP kaynak kartı alanları:

- Kaynak türü: Mevzuat / Yargı kararı / Kullanıcı dokümanı / AI çıkarımı
- Başlık
- Mahkeme / kurum
- Karar no / esas no / tarih
- İlgili madde / paragraf / kısa alıntı
- Güven durumu: Doğrulandı / Kısmen doğrulandı / Kaynak bulunamadı
- Kullanıldığı yer: Cevap, belge maddesi, edit önerisi

Verification log alanları:

- Event type: research, draft\_generated, edit\_suggested, edit\_accepted, edit\_rejected, source\_attached
- Timestamp
- User ID
- Chat ID
- Document ID
- Version ID
- Tool name
- Tool args özeti
- Source metadata
- Generated claim / inserted clause
- Confidence / verification status

Neden MVP’ye girmeli:

Hukuk AI ürününde güven sorununun cevabı budur. “Kaynak gösteriyoruz” demek yetmez; kaynak ile çıktı arasındaki ilişki görünür olmalı.

## 5. MVP’ye alınmaması gerekenler

### E-imza

E-imza fikri doğru ama MVP’ye girmemeli. Önce belge üretme, düzenleme, doğrulama akışı çalışmalı. E-imza ikinci veya üçüncü fazda “workflow completion” olarak eklenmeli.

### Gelişmiş contact list

Placeholder/contact seçimi MVP’de basit tutulmalı. Kullanıcı kişi/şirket alanını manuel doldurabilmeli. Tam contact CRM ikinci faza kalmalı.

### Tam tabular due diligence platformu

Tabular review repo’da var ve değerli. Ancak MVP’de ana pazarlama mesajını dağıtır. İlk fazda “belge karşılaştırma preview” olarak tutulabilir; tam DD matrisi ikinci faz.

### Çok fazla hukuk alanı workflow’u

MVP’de 30 workflow değil, 6-8 yüksek kaliteli workflow olmalı. Aksi halde kalite kontrol zorlaşır.

### Avukat dışı self-service hukuki tavsiye

Şirket kullanıcısına “kendi başına dava/danışmanlık” vaadi verilmemeli. Bu hem hukuki risk hem de güven sorunu yaratır.

## 6. MCP stratejisi

### MVP’de zorunlu MCP’ler

#### 1. Mevzuat MCP

Zorunlu. Çünkü hukuki cevabın normatif dayanağı buradan gelir.

Kullanım alanları:

- Kanun/madde arama
- Yönetmelik/tebliğ arama
- Madde içi arama
- Gerekçe
- Madde ağacı
- Yürürlük kontrolü

MVP’de öncelikli tool ailesi:

- `search_mevzuat`
- `get_mevzuat_content`
- `search_within_mevzuat`
- `get_mevzuat_gerekce`
- `get_mevzuat_madde_tree`
- `search_kanun`
- `search_within_kanun`

#### 2. Yargı MCP

Zorunlu. Çünkü Türk hukuk ürününün farkı içtihat ve kurum kararlarını doğrulayabilmesidir.

MVP’de öncelikli tool ailesi:

- `search_bedesten_unified`
- `get_bedesten_document_markdown`
- `search_emsal_detailed_decisions`
- `get_emsal_document_markdown`
- `search_anayasa_unified`
- `get_anayasa_document_unified`
- `search_kvkk_decisions`
- `get_kvkk_document_markdown`
- `search_gib_ozelge`
- `get_gib_ozelge_document_markdown`
- `check_government_servers_health`

### MVP’de opsiyonel / sınırlı MCP’ler

Aşağıdaki kaynaklar MVP’de tool olarak bulunabilir ama ürün akışında öne çıkarılmamalı:

- Rekabet Kurumu
- KİK
- Sayıştay
- BDDK
- Sigorta Tahkim
- Uyuşmazlık Mahkemesi

Bunlar practice area workflow’larıyla ikinci fazda daha anlamlı olur.

### MCP routing UX kararı

Kullanıcıya “hangi MCP’yi kullanmak istersin?” diye sorulmamalı.

Bolex kendi içinde karar vermeli:

- Normatif soru → Mevzuat MCP
- İçtihat sorusu → Yargı MCP
- Belge taslağı → önce Mevzuat, gerekirse Yargı
- KVKK/GİB gibi kurum pratiği → ilgili Yargı MCP tool ailesi
- Kaynak bulunamazsa → açık doğrulama uyarısı

## 7. MVP workflow listesi

MVP’de 8 workflow yeterli.

### 1. Kaynaklı hukuki araştırma

Kullanıcı sorusunu cevaplar; önce mevzuat, sonra gerekiyorsa yargı kararı bulur.

### 2. Dilekçe taslağı hazırla

Olay özeti, taraflar, talepler, dayanaklar ve sonuç bölümüyle taslak üretir.

### 3. Sözleşme taslağı hazırla

Taraflar, tanımlar, yükümlülükler, bedel, süre, fesih, uyuşmazlık, imza bloklarıyla taslak üretir.

### 4. Sözleşme risk analizi

Yüklenen sözleşmede risk, eksik hüküm, belirsizlik ve müzakere önerisi çıkarır.

### 5. Belgeyi revize et

Mevcut belge üzerinde clause-level edit önerir; kullanıcı kabul/reddeder.

### 6. Emsal karar bul ve özetle

Belirli konu için karar arar; künye, olay, hukuki ilke, uygulanabilirlik ve riskleri özetler.

### 7. İhtarname / cevap yazısı hazırla

Kısa, pratik, belge-odaklı çıktı üretir.

### 8. Belge içinden soru-cevap

Kullanıcının yüklediği belgeye dayalı cevap verir; doküman alıntısı olmadan iddia kurmaz.

## 8. Tiptap editor + verification log nasıl çalışmalı?

### Mevcut UI kararı

Mevcut üçlü layout korunmalı:

- Sol: doküman listesi
- Orta: Tiptap editor
- Sağ: chat

Bu yapı MVP için doğru. Yeni bir dördüncü panel veya sürekli açık kaynak paneli eklenmemeli. Verification bilgisi, metinden kopuk bir panelde değil, belge üzerindeki ilgili bölümle ilişkilendirilmiş şekilde gösterilmeli.

### İdeal MVP akışı

1. Kullanıcı workflow seçer veya doğal dille yazar.
2. Bolex task type belirler: araştırma / taslak / inceleme / revizyon.
3. Gerekli kaynaklar MCP ile toplanır.
4. AI output iki kanala ayrılır:
   - Chat cevabı
   - Editor değişikliği veya yeni editor dokümanı
5. Belge Tiptap içinde açılır.
6. AI tarafından eklenen, değiştirilen veya kaynakla desteklenen her bölüm için source/verification metadata kaydedilir.
7. Editor içinde ilgili paragraf/madde yanında küçük verification indicator görünür.
8. Kullanıcı indicator’a tıkladığında belge üzerinde floating verification card açılır.
9. Kullanıcı AI editlerini kabul/reddeder.
10. Kabul edilen değişiklik yeni document version oluşturur.
11. Verification event kayıtları backend’de saklanır.

### Editor içi verification indicator

Her kaynaklı veya AI tarafından etkilenmiş metin bloğunda küçük bir indicator/chip görünür.

Indicator tipleri:

- Kaynaklı
- Doğrulandı
- Kısmen doğrulandı
- Kaynak bulunamadı
- AI yorumu
- Kullanıcı dokümanına dayalı

Indicator ağır bir UI öğesi olmamalı. Belge profesyonel görünümünü korumalıdır. Bu nedenle hafif alt çizgi, sol kenar marker veya hover’da beliren küçük chip tercih edilmeli.

### Floating verification card

Kullanıcı indicator’a tıkladığında Tiptap editor üzerinde z-index ile küçük bir floating card açılır.

Kart içeriği:

- Kaynak türü: Mevzuat / Yargı kararı / Kullanıcı dokümanı / AI yorumu
- Kısa başlık
- Künye veya madde bilgisi
- Kısa alıntı
- Bu kaynak bu cümleyi/maddeyi neden destekliyor?
- Verification status
- “Detayı aç” butonu
- “Kaynağı kopyala” butonu

MVP’de kart küçük kalmalı. Tüm teknik log kartın içine sıkıştırılmamalı. Daha fazla detay gerektiğinde “Detayı aç” ile modal/drawer açılabilir.

### Edit kartı yapısı

AI edit önerileri de aynı editor-first mantıkla gösterilmeli.

Her AI edit önerisi şu bilgileri taşımalı:

- Değişiklik türü: ekleme / silme / yeniden yazım
- Etkilenen bölüm
- Önceki metin
- Önerilen metin
- Gerekçe
- Bağlı kaynaklar
- Verification status
- Kabul et
- Reddet

### Verification log MVP minimumu

MVP’de tam audit sistemi yerine backend’de event kaydı + editor’da bağlamsal görünüm yeterli.

Minimum event tipleri:

- `research_started`
- `mcp_tool_called`
- `source_attached`
- `draft_generated`
- `edit_suggested`
- `edit_accepted`
- `edit_rejected`
- `document_version_created`

Kullanıcıya bu event’lerin tamamı kronolojik log olarak gösterilmek zorunda değil. MVP’de asıl görünürlük belge üzerindeki source/verification card’ları olmalı.

## 9. Kullanıcıya doğrulanmış kaynak nasıl gösterilmeli?

### Kaynak gösterimi kuralı

Bolex’te kaynak üç seviyede gösterilmeli:

1. **Inline marker**\
   Cevap içinde küçük numara veya kaynak chip.

2. **Floating source card**\
   Belgedeki ilgili cümle, paragraf veya madde üzerinde açılan küçük bağlamsal kart. Gerekirse “Detayı aç” ile daha geniş modal/drawer açılabilir.

3. **Verification status**\
   Kaynağın doğrulama durumu.

### Source card örneği

**Yargıtay 3. Hukuk Dairesi**\
Konu: kira bedelinin uyarlanması\
Karar tarihi: …\
Esas/Karar no: …\
Kaynak: Yargı MCP\
Durum: Doğrulandı\
Kullanıldığı yer: Taslak madde 4.2 / Chat cevabı paragraf 2

### Verification status değerleri

- **Doğrulandı:** Kaynak MCP’den geldi ve metadata yeterli.
- **Kısmen doğrulandı:** Kaynak var ama metadata eksik veya tarih/numara belirsiz.
- **Kaynak bulunamadı:** AI iddia kurmamalı; kullanıcıya açık uyarı göstermeli.
- **Kullanıcı dokümanına dayalı:** Yüklenen belge içeriğinden alıntı.
- **AI yorumu:** Kaynaktan türetilmiş yorum; doğrudan kaynak metni değil.

## 10. MVP’de rolleri şimdilik sade tutma kararı

MVP’de avukat / stajyer / öğrenci / şirket kullanıcısı gibi ayrı ürün rolleri açmak stratejik olarak erken olabilir. Bu ayrım doğru ama MVP’de hem ürün akışını hem onboarding’i hem permission mantığını hem de mesajlaşmayı gereksiz karmaşıklaştırır.

Daha doğru MVP kararı:

**Tek lineer kullanıcı akışı: hukuk işi başlat → kaynakları doğrula → belgeyi üret/incele → editleri yönet → çıktı al.**

Bu akış her kullanıcı için aynıdır. Farklı kullanıcı tipleri pazarlama mesajında ve örnek workflow’larda sezdirilebilir ama ürün içinde henüz ayrı role/permission sistemine dönüştürülmemelidir.

### MVP için sade kullanıcı modeli

MVP’de kullanıcı sadece şu bağlamlardan biriyle çalışır:

1. **Araştırma yapıyorum**
2. **Belge hazırlıyorum**
3. **Belge inceliyorum**
4. **Belgeyi revize ediyorum**

Bu dört intent, role sisteminden daha faydalıdır. Çünkü kullanıcının kim olduğundan çok o anda ne yapmaya çalıştığı önemlidir.

### Roller ne zaman gelir?

Roller ikinci fazda, özellikle team/workspace çıktığında anlamlı olur:

- Owner / admin
- Avukat / reviewer
- Stajyer / drafter
- Client / viewer

Ama MVP’de bunları eklemek yerine tüm enerjiyi kaynak doğrulama, Tiptap edit deneyimi ve verification log’a vermek daha mantıklıdır.

## 11. Editor UI ve verification kartları

Mevcut UI kararını korumak mantıklı:

- Sol: doküman listesi
- Orta: Tiptap editor
- Sağ: chat

Bu düzen Bolex’in ana değerini doğru anlatıyor: kullanıcı chat ile talimat veriyor, ortada belge üzerinde çalışıyor, solda dosya/proje bağlamını yönetiyor.

### Verification için önerilen MVP kararı

Verification kartlarını ayrı bir dördüncü panel veya sürekli açık sağ panel olarak göstermek yerine, **doküman üzerinde ilgili bölümde z-index ile açılan küçük bağlamsal kartlar** olarak göstermek daha güçlü bir UX kararıdır.

Bunun nedeni:

1. Kaynak ile metin arasındaki ilişki kopmaz.
2. Kullanıcı belgeyi okurken doğrulama bilgisini yerinde görür.
3. Sağdaki chat alanı kirlenmez.
4. Soldaki doküman listesi sade kalır.
5. Bolex “editor-first legal workspace” gibi hissedilir.

### Nasıl çalışmalı?

Editor içinde AI tarafından üretilen, revize edilen veya kaynakla desteklenen bölümlerin yanında küçük bir verification indicator görünür.

Örnek indicator tipleri:

- Kaynaklı
- Doğrulandı
- Kısmen doğrulandı
- Kaynak bulunamadı
- AI yorumu
- Kullanıcı dokümanına dayalı

Kullanıcı indicator’a tıkladığında küçük bir floating card açılır.

### Floating verification card içeriği

Kartta maksimum şu bilgiler olmalı:

- Kaynak türü: Mevzuat / Yargı kararı / Kullanıcı dokümanı / AI yorumu
- Kısa başlık
- Künye veya madde bilgisi
- Kısa alıntı
- Bu kaynak bu cümleyi/maddeyi neden destekliyor?
- “Detayı aç” butonu
- “Kaynağı kopyala” butonu

MVP’de kart küçük kalmalı. Tüm teknik log kartın içinde değil, gerekirse “Detayı aç” ile daha geniş modal/drawer içinde gösterilmeli.

### Editor içi visual treatment

Belge metni ağır renklendirilmemeli. Hukuki belge profesyonel görünmeli.

Öneri:

- Hafif alt çizgi veya sol kenar marker
- Hover’da kaynak chip’i
- Tıklayınca floating card
- Riskli veya doğrulanamayan iddialarda daha belirgin uyarı rengi
- Accepted/rejected AI edits için küçük status chip

### Chat ile ilişki

Sağdaki chat kaynak listesinin yeri olmamalı. Chat sadece şu işleri yapmalı:

- Talimat almak
- Açıklama yapmak
- Kullanıcıya sonraki adımı önermek
- Edit/research işlemini tetiklemek

Kaynak ve verification bilgisi ise esas olarak belge üstünde görünmeli. Çünkü kullanıcı için kritik soru “bu cümle/madde neye dayanıyor?” sorusudur; cevap metnin yanında olmalıdır.

## 12. Hukuki tavsiye sınırı ürün davranışına nasıl gömülmeli?

Sadece footer disclaimer yeterli değil. Bolex şu ürün kurallarını uygulamalı:

1. Kaynaksız kesin hukuki iddia yok.
2. “Kesin kazanırsınız / kesin geçerlidir / kesin imzalayın” yok.
3. Riskli konularda seçenekli değerlendirme yapılır.
4. Kullanıcının olayına bağlı belirsizlikler açık yazılır.
5. Her belge “taslak” statüsünde başlar.
6. Final export öncesi “avukat kontrolü” uyarısı görünür.
7. AI yorumu ile doğrulanmış kaynak ayrıştırılır.

## 13. Teknik yol haritası

### Sprint 1: MVP yüzeyini daraltma

Hedef: Bolex’i tek bir anlaşılır workspace haline getirmek.

Yapılacaklar:

- Assistant landing / dashboard sadeleştirilecek.
- Ana CTA: “Yeni hukuki çalışma başlat”
- 8 MVP workflow listesi eklenecek.
- Workflow type seçimi: Araştırma / Taslak / İnceleme / Revizyon
- Tiptap editor ana yüzey olarak netleştirilecek.
- Editor içinde verification indicator + floating card iskeleti oluşturulacak.

Çıktı:

Kullanıcı ilk ekranda ne yapacağını anlar.

### Sprint 2: Kaynaklı araştırma çekirdeği

Hedef: Mevzuat + Yargı MCP kullanımını güvenilir ürün davranışına çevirmek.

Yapılacaklar:

- Tool call sonuçları normalize edilecek.
- Source metadata modeli oluşturulacak.
- MCP sonucundan source card üretilecek.
- “Doğrulandı / kısmen doğrulandı / bulunamadı” status eklenecek.
- `check_government_servers_health` hata durumunda kullanıcıya görünür uyarı verecek.

Çıktı:

Bolex kaynak gösteren araştırma ürünü gibi çalışır.

### Sprint 3: Draft-to-editor akışı

Hedef: AI cevabını Tiptap dokümana dönüştürmek.

Yapılacaklar:

- Workflow output schema tanımlanacak.
- Taslak çıktısı chat yerine editor document olarak oluşturulacak.
- Placeholder formatı standardize edilecek.
- İlk belge tipleri eklenecek: sözleşme, dilekçe, ihtarname.
- Export/download mevcut altyapıya bağlanacak.

Çıktı:

Kullanıcı “belge istiyorum” dediğinde düzenlenebilir belge elde eder.

### Sprint 4: AI edit + verification log

Hedef: Bolex’in en özgün farkını görünür yapmak.

Yapılacaklar:

- `document_edits` UI kartları tasarlanacak.
- Pending / accepted / rejected durumları editor üzerinde gösterilecek.
- Version history görünür yapılacak.
- Verification log event modeli eklenecek.
- Source card ile edit card ilişkilendirilecek.
- Floating verification card Tiptap selection/decoration mantığına bağlanacak.

Çıktı:

AI değişiklikleri kontrol edilebilir, izlenebilir ve güvenilir hale gelir.

### Sprint 5: Beta polish + hukuk güvenliği

Hedef: Launch öncesi güven, sınır ve kalite kontrol.

Yapılacaklar:

- Disclaimers ürün davranışına bağlanacak.
- Kaynaksız cevap uyarıları test edilecek.
- 20 örnek görevle QA yapılacak.
- Landing mesajı ve AGPL attribution netleştirilecek.

Çıktı:

Bolex beta kullanıcıya gösterilebilir hale gelir.

## 14. Codex için teknik implementation blueprint

Bu bölüm, belgeyi Codex’e parça parça yaptırmak için kullanılacak teknik yapılacaklar listesidir.

### 14.1. Öncelikli implementation sırası

Codex’e sırayla şu işleri yaptır:

1. Source reference veri modelini ekle.
2. Verification event veri modelini ekle.
3. MCP tool call sonuçlarını normalize eden backend helper yaz.
4. Chat/LLM akışında MCP sonuçlarından `source_references` üret.
5. Draft/edit çıktılarında ilgili metin bloklarına source reference bağla.
6. Tiptap editor içinde verification indicator göster.
7. Indicator click ile floating verification card aç.
8. AI edit accept/reject akışını source + verification event ile ilişkilendir.
9. 8 MVP workflow seed’ini ekle.
10. Eski sağ panel/source panel varsayımlarını kaldır; kaynak görünürlüğünü editor-first yap.

### 14.2. Backend: yeni tablolar

Mevcut schema üzerine aşağıdaki tablolar eklenmeli.

#### `source_references`

Amaç: Her MCP/doküman kaynağını normalize etmek.

Önerilen alanlar:

```sql
create table if not exists public.source_references (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_id uuid references public.projects(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  document_version_id uuid references public.document_versions(id) on delete set null,
  source_type text not null,
  provider text not null,
  tool_name text,
  title text,
  institution text,
  court text,
  chamber text,
  decision_date text,
  case_no text,
  decision_no text,
  legislation_no text,
  article_no text,
  url text,
  quote text,
  raw_payload jsonb,
  verification_status text not null default 'partial',
  created_at timestamptz not null default now()
);
```

`source_type` değerleri:

- `legislation`
- `case_law`
- `user_document`
- `administrative_decision`
- `tax_ruling`
- `ai_inference`

`verification_status` değerleri:

- `verified`
- `partial`
- `not_found`
- `user_document`
- `ai_inference`

#### `verification_events`

Amaç: Araştırma, taslak, edit ve kullanıcı kararlarını kaydetmek.

```sql
create table if not exists public.verification_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_id uuid references public.projects(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  document_version_id uuid references public.document_versions(id) on delete set null,
  event_type text not null,
  event_label text,
  tool_name text,
  tool_args_summary jsonb,
  source_reference_ids uuid[] not null default '{}',
  related_edit_id uuid references public.document_edits(id) on delete set null,
  status text not null default 'ok',
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

Minimum `event_type` değerleri:

- `research_started`
- `mcp_tool_called`
- `source_attached`
- `draft_generated`
- `edit_suggested`
- `edit_accepted`
- `edit_rejected`
- `document_version_created`

#### `document_placeholders`

Amaç: Tiptap içindeki değiştirilebilir AI alanlarını yönetmek.

```sql
create table if not exists public.document_placeholders (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid references public.document_versions(id) on delete cascade,
  field_key text not null,
  label text not null,
  value text,
  value_type text not null default 'text',
  source text not null default 'ai',
  required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 14.3. Backend: source normalization helper

Codex’e şu helper’ı yazdır:

Dosya önerisi:

`backend/src/lib/verification/sourceNormalizer.ts`

Görev:

MCP tool call sonucunu alıp normalize edilmiş `SourceReferenceInput[]` döndürmek.

Beklenen interface:

```ts
export type VerificationStatus =
  | 'verified'
  | 'partial'
  | 'not_found'
  | 'user_document'
  | 'ai_inference';

export type SourceType =
  | 'legislation'
  | 'case_law'
  | 'user_document'
  | 'administrative_decision'
  | 'tax_ruling'
  | 'ai_inference';

export type SourceReferenceInput = {
  source_type: SourceType;
  provider: 'yargi-mcp' | 'mevzuat-mcp' | 'user-document' | 'ai';
  tool_name?: string;
  title?: string;
  institution?: string;
  court?: string;
  chamber?: string;
  decision_date?: string;
  case_no?: string;
  decision_no?: string;
  legislation_no?: string;
  article_no?: string;
  url?: string;
  quote?: string;
  raw_payload?: unknown;
  verification_status: VerificationStatus;
};
```

Acceptance criteria:

- Mevzuat MCP sonuçları `source_type='legislation'` olarak normalize edilir.
- Yargı/Mahkeme kararları `source_type='case_law'` olarak normalize edilir.
- GİB özelgeleri `source_type='tax_ruling'` olarak normalize edilir.
- KVKK gibi kurum kararları `source_type='administrative_decision'` olarak normalize edilir.
- Metadata eksikse status `partial` olur.
- Sonuç yoksa `not_found` event’i üretilebilir ama sahte kaynak üretilmez.

### 14.4. Backend: verification repository helper

Dosya önerisi:

`backend/src/lib/verification/repository.ts`

Görev:

- `createSourceReferences(inputs)`
- `createVerificationEvent(input)`
- `attachSourcesToDocumentBlock(...)`
- `listSourcesForDocument(documentId)`
- `listVerificationEventsForDocument(documentId)`

Acceptance criteria:

- Tüm insert’ler authenticated user context ile yapılır.
- Project/chat/document ilişkileri nullable ama mümkünse doldurulur.
- Raw MCP payload saklanır ama frontend’e özetlenmiş metadata döner.

### 14.5. Frontend: Tiptap verification indicator

Dosya yerleri repo’ya göre Codex tarafından bulunmalı; ancak hedef component mantığı şu olmalı:

- Tiptap editor içinde source metadata taşıyan text/block range’leri decoration olarak işaretlenir.
- Hover’da küçük chip görünür.
- Click’te floating verification card açılır.
- Floating card editor alanı içinde absolute/fixed pozisyonlanır.
- Kart viewport dışına taşarsa pozisyonu otomatik düzeltilir.

Önerilen component isimleri:

- `VerificationIndicator`
- `FloatingVerificationCard`
- `VerificationStatusBadge`
- `SourceReferenceCard`

Acceptance criteria:

- Belge metni ağır renklendirilmez.
- Aynı paragrafta birden fazla kaynak varsa kart içinde kaynak listesi gösterilir.
- `verified`, `partial`, `not_found`, `ai_inference`, `user_document` status’ları farklı label ile görünür.
- Sağ chat paneli kaynak listesiyle kalabalıklaştırılmaz.

### 14.6. Frontend: AI edit kartları

AI edit önerileri mevcut `document_edits` yapısına bağlı kalmalı.

Yapılacaklar:

- Pending edit editor üzerinde görünür olmalı.
- Kabul/reddet action’ları mevcut backend endpoint’lerine bağlanmalı.
- Kabul/reddet sonrası `verification_events` kaydı oluşmalı.
- Edit kartında bağlı source reference varsa gösterilmeli.

Acceptance criteria:

- Kullanıcı edit’i kabul edince yeni document version oluşur.
- Kullanıcı edit’i reddedince status `rejected` olur.
- UI chat reload sonrası gerçek edit status’unu göstermeye devam eder.

### 14.7. Workflow seed’leri

8 MVP workflow seed’i eklenmeli:

1. Kaynaklı hukuki araştırma
2. Dilekçe taslağı hazırla
3. Sözleşme taslağı hazırla
4. Sözleşme risk analizi
5. Belgeyi revize et
6. Emsal karar bul ve özetle
7. İhtarname / cevap yazısı hazırla
8. Belge içinden soru-cevap

Her workflow için alanlar:

- `title`
- `type='assistant'`
- `practice`
- `prompt_md`
- `is_system=true`

Acceptance criteria:

- Workflow’lar sistem workflow’u olarak görünür.
- Kullanıcı bunları silemez ama gizleyebilir.
- Workflow prompt’ları MCP routing kurallarına uygun olur.
- Belge üretim workflow’ları mümkün olduğunda editor output üretir.

### 14.8. Codex çalışma formatı

Bu doküman Codex’e tek seferde verilebilir ama uygulama parça parça istenmeli.

Önerilen komut sırası:

1. “Bu belgeyi oku. Önce sadece migration ve type definitions ekle. UI’a dokunma.”
2. “Şimdi MCP source normalization helper’ını ekle ve mevcut MCP call akışına bağla.”
3. “Şimdi verification repository helper’ı ekle.”
4. “Şimdi Tiptap editor içinde verification indicator ve floating card UI’ını ekle.”
5. “Şimdi AI edit accept/reject akışına verification event yazmayı ekle.”
6. “Şimdi 8 MVP workflow seed’ini ekle.”
7. “Son olarak eski sağ panel/source log varsayımlarını temizle ve build/lint hatalarını düzelt.”

Her adım sonunda Codex’ten şunları iste:

- Değişen dosyalar listesi
- Migration açıklaması
- Test edilen komutlar
- Bilinen riskler
- Bir sonraki adım

## 15. Launch için önerilen MVP paketleri

### Free / Demo

- Sınırlı chat
- Sınırlı kaynaklı araştırma
- 1-2 belge taslağı
- Kaynak kartı görüntüleme

### Pro Solo

- Sınırsız veya yüksek limitli araştırma
- Belge taslağı
- DOCX export
- AI edit önerileri
- Version history
- Workflow kullanımı

### Studio / Büro

MVP sonrası.

- Team workspace
- Shared workflows
- Junior/partner approval
- Tabular review
- E-imza

## 16. En kritik ürün kararı

Bolex’i “AI hukuk chatbotu” olarak konumlandırma.

Bolex’in gerçek ürünü şudur:

**Kaynaklı araştırma + düzenlenebilir belge + doğrulama kaydı.**

MVP’de her karar bu üçlüye hizmet etmeli. Bir özellik bu üçlüden birini güçlendirmiyorsa ikinci faza kalmalı.

## 17. Hemen uygulanacak öncelik listesi

### Mutlaka yap

1. 8 MVP workflow’u oluştur.
2. Source card veri modelini kur.
3. Verification log UI iskeletini çıkar.
4. Tiptap belge üretimini ana akış yap.
5. AI edit kabul/reddet deneyimini görünür hale getir.
6. Mevzuat + Yargı MCP routing’i prompt değil ürün davranışı olarak sabitle.
7. “Taslak ve araştırma desteği” sınırını ürün davranışı olarak uygula.

### Yapma / ertele

1. E-imza
2. Tam contact CRM
3. Çok geniş plugin marketplace
4. Çoklu hukuk alanı otomasyonları
5. Şirketlere self-service hukuki tavsiye
6. Gelişmiş team permission sistemi
7. Tam tabular DD platformu

## 18. MVP başarı kriterleri

Bolex MVP başarılı sayılırsa kullanıcı şu 5 şeyi net şekilde yapabiliyor olmalı:

1. Bir Türk hukuku sorusuna kaynaklı cevap alabiliyor.
2. Bir hukuki belgeyi düzenlenebilir şekilde üretebiliyor.
3. Yüklediği belgeyi kaynaklı/riskli şekilde inceletebiliyor.
4. AI editlerini kabul/reddedebiliyor.
5. Hangi iddianın hangi kaynağa dayandığını görebiliyor.

Bunlar çalışıyorsa Bolex MVP launch edilebilir.

## 19. Son karar

MVP’nin adı içeride şu olabilir:

**Bolex Verified Drafting Workspace**

Dışarıdaki basit karşılığı:

**“Türk hukuku için kaynaklı AI belge çalışma alanı.”**

Bu, hem Mike tabanından gelen genel AI workspace gücünü korur hem de Bolex’i Türkiye hukukuna özel, kaynak/do

