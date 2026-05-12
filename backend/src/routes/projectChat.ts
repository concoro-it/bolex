import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createServerSupabase } from "../lib/supabase";
import {
    buildProjectDocContext,
    buildMessages,
    buildWorkflowStore,
    enrichWithPriorEvents,
    extractAnnotations,
    runLLMStream,
    PROJECT_EXTRA_TOOLS,
    type ChatMessage,
} from "../lib/chatTools";
import { getUserApiKeys } from "../lib/userSettings";
import { checkProjectAccess } from "../lib/access";

const PROJECT_SYSTEM_PROMPT_EXTRA = `PROJE BAĞLAMI:
Bir proje klasörü içinde çalışıyorsun; bu klasör, kullanıcının tek bir uyuşmazlık/mesele için düzenlediği bir grup hukuki doküman içerir. Kullanıcının soruları genellikle bu projedeki bir veya daha fazla dokümana referans verir - görevin, üzerinde çalışılması gereken ilgili dosyaları bulmaktır. Nelerin mevcut olduğunu görmek için 'list_documents' kullan ve yanıt vermeden önce ihtiyacın olan dokümanları çekmek için 'fetch_documents' / 'read_document' çağır.

Bir doküman şu anda kullanıcının yan panelinde görüntüleniyor olabilir; sağlandığında bunu kullanıcının muhtemel odağı için bağlam olarak kabul et, ancak kullanıcının sorduğu tek ya da kesin doküman olduğunu varsayma. Talep projedeki başka dosyalara da uygulanabiliyorsa, onları da tespit edip oku. Sadece ekranda görünen dosyayı aşırı dar yorumlamak yerine ilgili proje dokümanlarının tamamını kapsamayı tercih et.

BELGE ÇOĞALTMA:
Kullanıcı mevcut bir proje dokümanını yeni bir dosya için başlangıç noktası olarak kullanmak istediğinde (ör. "bu NDA'yı şablon olarak kullan", "SOW'un bir kopyasını yap, düzenleyeyim", "bunu çoğalt ve şirket X'e göre uyarla"), kaynak 'doc_id' ile 'replicate_document' aracını çağır. Bu, belgeyi birebir kopya olarak yeni bir proje dokümanı halinde oluşturur, yeni bir 'doc_id' slug döndürür ve UI'da bir indirme/açma kartı gösterir. Ardından kullanıcının istediği değişiklikleri yapmak için dönen slug üzerinde 'edit_document' çağır - kullanıcı mevcut dokümanın yapısını ve biçimini korumak istiyorsa 'generate_docx' kullanma.`;

export const projectChatRouter = Router({ mergeParams: true });

// POST /projects/:projectId/chat — streaming
projectChatRouter.post("/", requireAuth, async (req, res) => {
    const userId = res.locals.userId as string;
    const userEmail = res.locals.userEmail as string | undefined;
    const { projectId } = req.params;
    const { messages, chat_id, model, displayed_doc, attached_documents } =
        req.body as {
            messages: ChatMessage[];
            chat_id?: string;
            model?: string;
            displayed_doc?: { filename: string; document_id: string };
            attached_documents?: { filename: string; document_id: string }[];
        };

    const db = createServerSupabase();

    // Verify the user has access to the project (owner or shared member).
    const projectAccess = await checkProjectAccess(
        projectId,
        userId,
        userEmail,
        db,
    );
    if (!projectAccess.ok)
        return void res.status(404).json({ detail: "Project not found" });

    let chatId = chat_id ?? null;
    let chatTitle: string | null = null;

    if (chatId) {
        const { data: existing } = await db
            .from("chats")
            .select("id, title, project_id")
            .eq("id", chatId)
            .single();
        const canUse = !!existing && existing.project_id === projectId;
        if (!canUse) chatId = null;
        else chatTitle = existing!.title;
    }

    if (!chatId) {
        const { data: newChat, error } = await db
            .from("chats")
            .insert({ user_id: userId, project_id: projectId })
            .select("id, title")
            .single();
        if (error || !newChat)
            return void res
                .status(500)
                .json({ detail: "Failed to create chat" });
        chatId = newChat.id as string;
        chatTitle = newChat.title;
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
        await db.from("chat_messages").insert({
            chat_id: chatId,
            role: "user",
            content: lastUser.content,
            files: lastUser.files ?? null,
            workflow: lastUser.workflow ?? null,
        });
    }

    const { docIndex, docStore, folderPaths } = await buildProjectDocContext(
        projectId,
        userId,
        db,
    );
    const docAvailability = Object.entries(docIndex).map(([doc_id, info]) => ({
        doc_id,
        filename: info.filename,
        folder_path: folderPaths.get(doc_id),
    }));

    const enrichedMessages = await enrichWithPriorEvents(
        messages,
        chatId,
        db,
        docIndex,
    );
    const messagesForLLM: ChatMessage[] = displayed_doc
        ? enrichedMessages.map((m, i) => {
              if (i !== enrichedMessages.length - 1 || m.role !== "user")
                  return m;
              return {
                  ...m,
                  content: `${m.content}\n\ndisplayed_doc: ${displayed_doc.filename}, displayed_doc_id: ${displayed_doc.document_id}`,
              };
          })
        : enrichedMessages;

    // The user-attached docs for this turn (dragged into / picked from
    // the chat input) come in as a request-level field. Surface them in
    // the system prompt with the current-turn doc_id slugs so the model
    // knows which docs the user is highlighting *now*, distinct from
    // the broader project doc list.
    let systemPromptExtra = PROJECT_SYSTEM_PROMPT_EXTRA;
    if (attached_documents?.length) {
        const slugByDocumentId = new Map<string, string>();
        for (const [slug, info] of Object.entries(docIndex)) {
            if (info.document_id)
                slugByDocumentId.set(info.document_id, slug);
        }
        const lines = attached_documents.map((d) => {
            const slug = slugByDocumentId.get(d.document_id);
            return slug ? `- ${slug}: ${d.filename}` : `- ${d.filename}`;
        });
        systemPromptExtra += `\n\nBU TUR İÇİN KULLANICI EKLERİ:\nKullanıcı son mesajına aşağıdaki doküman(lar)ı doğrudan ekledi. Mesajı açıkça aksi söylemiyorsa bunları talebin ana odağı olarak kabul et.\n${lines.join("\n")}`;
    }

    const apiMessages = buildMessages(
        messagesForLLM,
        docAvailability,
        systemPromptExtra,
    );

    const workflowStore = await buildWorkflowStore(userId, userEmail, db);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const write = (line: string) => res.write(line);

    const apiKeys = await getUserApiKeys(userId, db);

    try {
        write(`data: ${JSON.stringify({ type: "chat_id", chatId })}\n\n`);

        const { fullText, events } = await runLLMStream({
            apiMessages,
            docStore,
            docIndex,
            userId,
            db,
            write,
            extraTools: PROJECT_EXTRA_TOOLS,
            workflowStore,
            model,
            apiKeys,
            projectId,
        });

        const annotations = extractAnnotations(fullText, docIndex, events);
        await db.from("chat_messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: events.length ? events : null,
            annotations: annotations.length ? annotations : null,
        });

        if (!chatTitle && lastUser?.content) {
            await db
                .from("chats")
                .update({ title: lastUser.content.slice(0, 120) })
                .eq("id", chatId);
        }
    } catch (err) {
        console.error("[project-chat/stream] error:", err);
        try {
            write(
                `data: ${JSON.stringify({ type: "error", message: "Stream error" })}\n\n`,
            );
            write("data: [DONE]\n\n");
        } catch {
            /* ignore */
        }
    } finally {
        res.end();
    }
});
