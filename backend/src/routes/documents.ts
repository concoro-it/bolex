import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createServerSupabase } from "../lib/supabase";
import {
  buildContentDisposition,
  downloadFile,
  deleteFile,
  getSignedUrl,
  storageKey,
  uploadFile,
  versionStorageKey,
} from "../lib/storage";
import { docxToPdf, convertedPdfKey } from "../lib/convert";
import {
  extractTrackedChangeIds,
  resolveTrackedChange,
} from "../lib/docxTrackedChanges";
import { buildDownloadUrl } from "../lib/downloadTokens";
import {
  attachActiveVersionPaths,
  attachLatestVersionNumbers,
  loadActiveVersion,
} from "../lib/documentVersions";
import { ensureDocAccess } from "../lib/access";
import { singleFileUpload } from "../lib/upload";
import { recordVerificationEvent } from "../lib/verification";

export const documentsRouter = Router();
const ALLOWED_TYPES = new Set(["pdf", "docx", "doc"]);

type TiptapMark = { type?: string };
type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown> | null;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

const VERSIONED_SOURCES = ["upload", "user_upload", "assistant_edit", "manual_edit", "generated", "user_accept", "user_reject"];
const EDITOR_CONVERSION_TIMEOUT_MS = 45_000;
const SOURCE_REFERENCE_SELECT =
  "id, document_id, document_version_id, chat_id, source_type, provider, tool_name, title, institution, court, chamber, decision_date, case_no, decision_no, legislation_no, article_no, url, quote, verification_status, created_at";

type SourceReferenceRow = {
  id: string;
  document_id?: string | null;
  document_version_id?: string | null;
  chat_id?: string | null;
  source_type: string;
  provider: string;
  tool_name?: string | null;
  title?: string | null;
  institution?: string | null;
  court?: string | null;
  chamber?: string | null;
  decision_date?: string | null;
  case_no?: string | null;
  decision_no?: string | null;
  legislation_no?: string | null;
  article_no?: string | null;
  url?: string | null;
  quote?: string | null;
  verification_status: string;
  created_at?: string;
};

async function loadDocumentSourceLinks(
  db: ReturnType<typeof createServerSupabase>,
  documentId: string,
  projectId?: string | null,
  versionId?: string | null,
) {
  let query = db
    .from("document_source_links")
    .select(
      `id, document_id, document_version_id, source_reference_id, anchor_type, anchor_text, block_key, from_pos, to_pos, created_at, source_references(${SOURCE_REFERENCE_SELECT})`,
    )
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (versionId) query = query.eq("document_version_id", versionId);
  const { data, error } = await query;
  if (error) {
    console.warn("[source-links] query failed", error);
    return [];
  }
  if (data?.length) return data;

  return loadFallbackDocumentSourceLinks(db, documentId, projectId, versionId);
}

async function loadFallbackDocumentSourceLinks(
  db: ReturnType<typeof createServerSupabase>,
  documentId: string,
  projectId?: string | null,
  versionId?: string | null,
) {
  const { data: edits, error: editsError } = await db
    .from("document_edits")
    .select("id, version_id, change_id, inserted_text, deleted_text, context_before, context_after, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (editsError || !edits?.length) {
    if (editsError) console.warn("[source-links:fallback] edits query failed", editsError);
    return loadQuoteBasedSourceLinks(db, documentId, projectId, versionId);
  }

  const editIds = edits.map((edit) => edit.id as string).filter(Boolean);
  const { data: events, error: eventsError } = await db
    .from("verification_events")
    .select("related_edit_id, source_reference_ids")
    .eq("document_id", documentId)
    .in("related_edit_id", editIds);
  if (eventsError || !events?.length) {
    if (eventsError) console.warn("[source-links:fallback] events query failed", eventsError);
    return loadQuoteBasedSourceLinks(db, documentId, projectId, versionId);
  }

  const sourceIds = [
    ...new Set(
      events.flatMap((event) =>
        Array.isArray(event.source_reference_ids)
          ? (event.source_reference_ids as string[])
          : [],
      ),
    ),
  ].filter(Boolean);
  if (!sourceIds.length) return loadQuoteBasedSourceLinks(db, documentId, projectId, versionId);

  const { data: sources, error: sourcesError } = await db
    .from("source_references")
    .select(SOURCE_REFERENCE_SELECT)
    .in("id", sourceIds);
  if (sourcesError || !sources?.length) {
    if (sourcesError) console.warn("[source-links:fallback] sources query failed", sourcesError);
    return loadQuoteBasedSourceLinks(db, documentId, projectId, versionId);
  }

  const sourcesById = new Map(
    (sources as SourceReferenceRow[]).map((source) => [source.id, source]),
  );
  const editsById = new Map(edits.map((edit) => [edit.id as string, edit]));

  const eventLinks = events.flatMap((event) => {
    const editId = event.related_edit_id as string | null;
    if (!editId) return [];
    const edit = editsById.get(editId);
    if (!edit) return [];
    const anchorText =
      (edit.inserted_text as string | null) ||
      (edit.deleted_text as string | null) ||
      (edit.context_before as string | null) ||
      (edit.context_after as string | null) ||
      null;
    if (!anchorText) return [];

    const eventSourceIds = Array.isArray(event.source_reference_ids)
      ? (event.source_reference_ids as string[])
      : [];
    return eventSourceIds.flatMap((sourceId) => {
      const source = sourcesById.get(sourceId);
      if (!source) return [];
      return [
        {
          id: `fallback:${editId}:${sourceId}`,
          document_id: documentId,
          document_version_id: versionId ?? (edit.version_id as string | null),
          source_reference_id: sourceId,
          anchor_type: "quote",
          anchor_text: anchorText,
          block_key: (edit.change_id as string | null) ?? null,
          from_pos: null,
          to_pos: null,
          created_at: (edit.created_at as string | null) ?? null,
          source_references: source,
        },
      ];
    });
  });
  if (eventLinks.length) return eventLinks;
  return loadQuoteBasedSourceLinks(db, documentId, projectId, versionId);
}

async function loadQuoteBasedSourceLinks(
  db: ReturnType<typeof createServerSupabase>,
  documentId: string,
  projectId?: string | null,
  versionId?: string | null,
) {
  let query = db
    .from("source_references")
    .select(SOURCE_REFERENCE_SELECT)
    .eq("document_id", documentId)
    .not("quote", "is", null)
    .order("created_at", { ascending: false })
    .limit(80);
  if (versionId) query = query.eq("document_version_id", versionId);

  const { data: exactSources, error: exactError } = await query;
  if (exactError) console.warn("[source-links:quote-fallback] exact query failed", exactError);

  let sources = exactSources as SourceReferenceRow[] | null;
  if (!sources?.length && versionId) {
    const fallback = await db
      .from("source_references")
      .select(SOURCE_REFERENCE_SELECT)
      .eq("document_id", documentId)
      .not("quote", "is", null)
      .order("created_at", { ascending: false })
      .limit(80);
    if (fallback.error) {
      console.warn("[source-links:quote-fallback] document query failed", fallback.error);
      return loadProjectMcpSourceLinks(db, documentId, projectId);
    }
    sources = fallback.data as SourceReferenceRow[] | null;
  }
  if (!sources?.length) return loadProjectMcpSourceLinks(db, documentId, projectId);

  const quoteLinks = sources.flatMap((source) => {
    const anchorText = source.quote?.trim();
    if (!anchorText) return [];
    return [
      {
        id: `source-ref:${source.id}`,
        document_id: documentId,
        document_version_id: versionId ?? source.document_version_id ?? null,
        source_reference_id: source.id,
        anchor_type: "quote",
        anchor_text: anchorText,
        block_key: null,
        from_pos: null,
        to_pos: null,
        created_at: source.created_at ?? null,
        source_references: source,
      },
    ];
  });
  return [
    ...quoteLinks,
    ...(await loadProjectMcpSourceLinks(db, documentId, projectId)),
  ];
}

async function loadProjectMcpSourceLinks(
  db: ReturnType<typeof createServerSupabase>,
  documentId: string,
  projectId?: string | null,
) {
  if (!projectId) return [];
  const { data, error } = await db
    .from("source_references")
    .select(SOURCE_REFERENCE_SELECT)
    .eq("project_id", projectId)
    .is("document_id", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data?.length) {
    if (error) console.warn("[source-links:mcp-fallback] query failed", error);
    return [];
  }

  const seen = new Set<string>();
  return (data as SourceReferenceRow[]).flatMap((source) => {
    const anchors = sourceAnchorCandidates(source);
    return anchors.flatMap((anchorText) => {
      const key = `${source.id}:${anchorText.toLocaleLowerCase("tr-TR")}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [
        {
          id: `mcp-source:${source.id}:${seen.size}`,
          document_id: documentId,
          document_version_id: null,
          source_reference_id: source.id,
          anchor_type: "quote",
          anchor_text: anchorText,
          block_key: null,
          from_pos: null,
          to_pos: null,
          created_at: source.created_at ?? null,
          source_references: source,
        },
      ];
    });
  });
}

function sourceAnchorCandidates(source: SourceReferenceRow) {
  const candidates = new Set<string>();
  const add = (value: string | null | undefined) => {
    const normalized = value?.replace(/\s+/g, " ").trim();
    if (normalized && normalized.length >= 4 && normalized.length <= 180) {
      candidates.add(normalized);
    }
  };

  add(source.title);
  add(source.legislation_no);
  add(source.article_no);
  if (source.legislation_no && source.title) {
    add(`${source.legislation_no} sayılı ${source.title}`);
  }

  const quote = source.quote ?? "";
  const bracketLawMatch = quote.match(/\[(\d{3,5})\]\s+([A-ZÇĞİÖŞÜ\s]+KANUNU)/i);
  if (bracketLawMatch) {
    const lawNo = bracketLawMatch[1];
    const lawName = titleCaseTurkish(bracketLawMatch[2]);
    add(lawName);
    add(`${lawNo} sayılı ${lawName}`);
  }

  const lawNameMatch = quote.match(/([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s]{8,}?KANUNU)/i);
  if (lawNameMatch) add(titleCaseTurkish(lawNameMatch[1]));

  const keywordMatch = quote.match(/Keyword:\s*['"]?([^'"\n]+)['"]?/i);
  if (keywordMatch) add(keywordMatch[1]);

  return [...candidates];
}

function titleCaseTurkish(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

function textAlignFromAttrs(attrs: Record<string, unknown> | null | undefined) {
  const value = typeof attrs?.textAlign === "string" ? attrs.textAlign : undefined;
  if (value === "center" || value === "right" || value === "justify") return value;
  return "left";
}

function collectPlainText(node: TiptapNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(collectPlainText).join("");
}

function isZipDocx(bytes: ArrayBuffer): boolean {
  const view = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 4));
  return view[0] === 0x50 && view[1] === 0x4b;
}

async function tiptapJsonToDocxBuffer(content: TiptapNode, title: string): Promise<Buffer> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");

  const FONT = "Times New Roman";
  const SIZE = 22;
  const headingMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  const alignmentMap = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  } as const;
  const cellBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
  };

  const inlineRuns = (
    nodes: TiptapNode[] | undefined,
    opts?: { forceBold?: boolean },
  ): InstanceType<typeof TextRun>[] => {
    const runs: InstanceType<typeof TextRun>[] = [];
    for (const node of nodes ?? []) {
      if (node.type === "hardBreak") {
        runs.push(new TextRun({ text: "", break: 1 }));
        continue;
      }
      if (typeof node.text === "string") {
        const markTypes = new Set((node.marks ?? []).map((m) => m.type));
        runs.push(
          new TextRun({
            text: node.text,
            font: FONT,
            size: SIZE,
            bold: opts?.forceBold || markTypes.has("bold"),
            italics: markTypes.has("italic"),
          }),
        );
        continue;
      }
      runs.push(...inlineRuns(node.content, opts));
    }
    return runs;
  };

  type DocChild = InstanceType<typeof Paragraph> | InstanceType<typeof Table>;
  const children: DocChild[] = [];

  const paragraphFromNode = (
    node: TiptapNode,
    opts?: { bullet?: boolean; ordered?: boolean; headingLevel?: number; forceBold?: boolean },
  ) => {
    const text = collectPlainText(node);
    const runs = inlineRuns(node.content, { forceBold: opts?.forceBold });
    const childRuns = runs.length ? runs : [new TextRun({ text, font: FONT, size: SIZE })];
    if (!text.trim() && !opts?.headingLevel) {
      return new Paragraph({ children: [new TextRun({ text: "" })] });
    }
    const align = textAlignFromAttrs(node.attrs);
    return new Paragraph({
      heading: opts?.headingLevel ? headingMap[Math.min(opts.headingLevel, 3)] : undefined,
      bullet: opts?.bullet ? { level: 0 } : undefined,
      numbering: opts?.ordered ? { reference: "ordered-list", level: 0 } : undefined,
      alignment: alignmentMap[align],
      spacing: { after: 120 },
      children: childRuns,
    });
  };

  const pushParagraph = (
    node: TiptapNode,
    opts?: { bullet?: boolean; ordered?: boolean; headingLevel?: number },
  ) => {
    children.push(paragraphFromNode(node, opts));
  };

  const cellParagraphs = (cell: TiptapNode, forceBold: boolean) => {
    const paragraphs: InstanceType<typeof Paragraph>[] = [];
    for (const child of cell.content ?? []) {
      if (child.type === "paragraph") {
        const text = collectPlainText(child);
        const runs = inlineRuns(child.content, { forceBold });
        paragraphs.push(
          new Paragraph({
            alignment: alignmentMap[textAlignFromAttrs(child.attrs)],
            spacing: { after: 80 },
            children: runs.length
              ? runs
              : [new TextRun({ text, font: FONT, size: SIZE, bold: forceBold })],
          }),
        );
      } else if (child.type === "heading") {
        const level =
          typeof child.attrs?.level === "number" ? child.attrs.level : 1;
        paragraphs.push(paragraphFromNode(child, { headingLevel: level }));
      } else if (child.type === "bulletList" || child.type === "orderedList") {
        for (const item of child.content ?? []) {
          for (const paragraph of item.content ?? []) {
            if (paragraph.type !== "paragraph") continue;
            paragraphs.push(
              paragraphFromNode(paragraph, {
                bullet: child.type === "bulletList",
                ordered: child.type === "orderedList",
              }),
            );
          }
        }
      }
    }
    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }
    return paragraphs;
  };

  const cellWidth = (cell: TiptapNode) => {
    const colwidth = cell.attrs?.colwidth;
    if (
      Array.isArray(colwidth) &&
      typeof colwidth[0] === "number" &&
      Number.isFinite(colwidth[0])
    ) {
      return { size: Math.max(720, Math.round(colwidth[0] * 15)), type: WidthType.DXA };
    }
    return undefined;
  };

  const buildTable = (node: TiptapNode) => {
    const rows: InstanceType<typeof TableRow>[] = [];
    for (const row of node.content ?? []) {
      if (row.type !== "tableRow") continue;
      const cells = (row.content ?? []).filter(
        (cell) => cell.type === "tableCell" || cell.type === "tableHeader",
      );
      rows.push(
        new TableRow({
          tableHeader: cells.every((cell) => cell.type === "tableHeader"),
          children: cells.map((cell) => {
            const isHeader = cell.type === "tableHeader";
            return new TableCell({
              borders: cellBorder,
              shading: isHeader ? { fill: "F3F4F6" } : undefined,
              width: cellWidth(cell),
              children: cellParagraphs(cell, isHeader),
            });
          }),
        }),
      );
    }
    if (rows.length === 0) return null;
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });
  };

  const walkBlocks = (nodes: TiptapNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === "paragraph") {
        pushParagraph(node);
      } else if (node.type === "heading") {
        const level =
          typeof node.attrs?.level === "number" ? node.attrs.level : 1;
        pushParagraph(node, { headingLevel: level });
      } else if (node.type === "bulletList" || node.type === "orderedList") {
        for (const item of node.content ?? []) {
          const paragraphs = (item.content ?? []).filter(
            (child) => child.type === "paragraph" || child.type === "heading",
          );
          for (const paragraph of paragraphs) {
            pushParagraph(paragraph, {
              bullet: node.type === "bulletList",
              ordered: node.type === "orderedList",
            });
          }
        }
      } else if (node.type === "blockquote") {
        for (const child of node.content ?? []) {
          if (child.type === "paragraph" || child.type === "heading") {
            pushParagraph(child);
          }
        }
      } else if (node.type === "horizontalRule") {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: "______________________________",
                font: FONT,
                size: SIZE,
              }),
            ],
          }),
        );
      } else if (node.type === "table") {
        const table = buildTable(node);
        if (table) {
          children.push(table);
          children.push(new Paragraph({ text: "" }));
        }
      }
    }
  };

  walkBlocks(content.content);
  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: title || "Document", font: FONT, size: SIZE })] }));
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

// GET /single-documents
documentsRouter.get("/", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const db = createServerSupabase();
  const { data, error } = await db
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .is("project_id", null)
    .order("created_at", { ascending: false });
  if (error) return void res.status(500).json({ detail: error.message });
  const docs = (data ?? []) as unknown as {
    id: string;
    current_version_id?: string | null;
  }[];
  await attachLatestVersionNumbers(db, docs);
  await attachActiveVersionPaths(db, docs);
  res.json(docs);
});

// POST /single-documents
documentsRouter.post(
  "/",
  requireAuth,
  singleFileUpload("file"),
  async (req, res) => {
    const userId = res.locals.userId as string;
    const db = createServerSupabase();
    await handleDocumentUpload(req, res, userId, null, db);
  },
);

// DELETE /single-documents/:documentId
documentsRouter.delete("/:documentId", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const { documentId } = req.params;
  const db = createServerSupabase();

  const { data: doc, error } = await db
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();
  if (error || !doc)
    return void res.status(404).json({ detail: "Document not found" });

  // Storage now lives on document_versions — fan out and delete each
  // version's bytes (DOCX + PDF rendition) before dropping rows.
  const { data: versions } = await db
    .from("document_versions")
    .select("storage_path, pdf_storage_path")
    .eq("document_id", documentId);
  await Promise.all(
    (versions ?? []).flatMap((v) =>
      [v.storage_path, v.pdf_storage_path]
        .filter((p): p is string => typeof p === "string" && p.length > 0)
        .map((p) => deleteFile(p).catch(() => {})),
    ),
  );
  await db.from("documents").delete().eq("id", documentId);
  res.status(204).send();
});

// GET /single-documents/:documentId/display
// Optional ?version_id= renders a historical version. Defaults to the
// document's current_version_id.
documentsRouter.get("/:documentId/display", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string;
  const { documentId } = req.params;
  const versionIdParam =
    typeof req.query.version_id === "string" ? req.query.version_id : null;
  const db = createServerSupabase();

  const { data: doc } = await db
    .from("documents")
    .select("id, filename, file_type, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (!doc)
    return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok)
    return void res.status(404).json({ detail: "Document not found" });

  const active = await loadActiveVersion(documentId, db, versionIdParam);
  if (!active)
    return void res.status(404).json({ detail: "No file available" });

  const fileType = (doc.file_type as string) ?? "";
  const isDocx = fileType === "docx" || fileType === "doc";

  // For DOCX, prefer the per-version PDF rendition if one exists.
  const servePath =
    isDocx && active.pdf_storage_path
      ? active.pdf_storage_path
      : active.storage_path;
  const raw = await downloadFile(servePath);
  if (!raw)
    return void res
      .status(404)
      .json({ detail: "Document not found in storage" });

  if (fileType === "pdf" || (isDocx && active.pdf_storage_path)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      buildContentDisposition("inline", doc.filename as string),
    );
    res.send(Buffer.from(raw));
  } else {
    // Fallback: serve raw DOCX (mammoth will handle it client-side)
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      buildContentDisposition("inline", doc.filename as string),
    );
    res.send(Buffer.from(raw));
  }
});

// POST /single-documents/download-zip
documentsRouter.post("/download-zip", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { document_ids } = req.body as { document_ids?: string[] };

  if (!Array.isArray(document_ids) || document_ids.length === 0)
    return void res.status(400).json({ detail: "document_ids is required" });

  const db = createServerSupabase();
  const { data: rawDocs, error } = await db
    .from("documents")
    .select("id, filename, file_type, current_version_id, user_id, project_id")
    .in("id", document_ids);

  if (error) return void res.status(500).json({ detail: error.message });
  // Filter to docs the user actually has access to (own + shared-project).
  const accessChecks = await Promise.all(
    (rawDocs ?? []).map(async (d) => ({
      doc: d,
      access: await ensureDocAccess(
        d as { user_id: string; project_id: string | null },
        userId,
        userEmail,
        db,
      ),
    })),
  );
  const docs = accessChecks
    .filter((x) => x.access.ok)
    .map((x) => x.doc as { id: string; filename: string });
  if (!docs || docs.length === 0)
    return void res.status(404).json({ detail: "No documents found" });

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  await Promise.all(
    docs.map(async (doc) => {
      const active = await loadActiveVersion(doc.id, db);
      if (!active) return;
      const raw = await downloadFile(active.storage_path);
      if (!raw) return;
      zip.file(doc.filename, Buffer.from(raw));
    }),
  );

  const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="documents.zip"');
  res.send(content);
});

// GET /single-documents/:documentId/url
// Optional ?version_id= selects a specific tracked-changes version.
// Otherwise falls back to documents.current_version_id, else the original upload.
documentsRouter.get("/:documentId/url", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId } = req.params;
  const versionIdParam = typeof req.query.version_id === "string" ? req.query.version_id : null;
  const db = createServerSupabase();

  const { data: doc, error } = await db
    .from("documents")
    .select("id, filename, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (error || !doc)
    return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok)
    return void res.status(404).json({ detail: "Document not found" });

  const active = await loadActiveVersion(documentId, db, versionIdParam);
  if (!active)
    return void res.status(404).json({ detail: "No file available" });

  const downloadFilename = resolveDownloadFilename(
    doc.filename as string,
    active.display_name,
    active.version_number,
  );
  const url = await getSignedUrl(
    active.storage_path,
    3600,
    downloadFilename,
  );
  if (!url)
    return void res.status(503).json({ detail: "Storage not configured" });

  res.json({
    url,
    document_id: documentId,
    filename: downloadFilename,
    version_id: active.id,
    // Lets the frontend decide between DocView (PDF.js) and DocxView
    // (docx-preview) without a follow-up round-trip.
    has_pdf_rendition: !!active.pdf_storage_path,
  });
});

// GET /single-documents/:documentId/docx
// Streams the raw .docx bytes for the given document, optionally at a
// specific tracked-changes version. Unlike /url, this bypasses R2 (avoids
// the browser CORS problem on signed URLs) so the frontend docx-preview
// viewer can load tracked-change documents directly.
documentsRouter.get("/:documentId/docx", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId } = req.params;
  const versionIdParam = typeof req.query.version_id === "string" ? req.query.version_id : null;
  const db = createServerSupabase();

  const { data: doc, error } = await db
    .from("documents")
    .select("id, filename, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (error || !doc)
    return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok)
    return void res.status(404).json({ detail: "Document not found" });

  const active = await loadActiveVersion(documentId, db, versionIdParam);
  if (!active)
    return void res.status(404).json({ detail: "No file available" });

  const raw = await downloadFile(active.storage_path);
  if (!raw)
    return void res.status(404).json({ detail: "Document bytes not available" });
  if (!isZipDocx(raw)) {
    return void res.status(400).json({
      detail: "This file is not a valid DOCX package and cannot be edited in the browser.",
    });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.setHeader(
    "Content-Disposition",
    buildContentDisposition(
      "inline",
      resolveDownloadFilename(
        doc.filename as string,
        active.display_name,
        active.version_number,
      ),
    ),
  );
  res.send(Buffer.from(raw));
});

// Compose a download-friendly filename that carries the edit version
// marker: "Purchase Agreement.docx" → "Purchase Agreement [Edited V2].docx".
// Preserves the original extension (fallback: .docx).
function versionedFilename(filename: string, version: number | null): string {
  if (!version || version < 1) return filename;
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : ".docx";
  return `${stem} [Edited V${version}]${ext}`;
}

// Produce the filename a download should present to the user for a given
// (document, version) pair. Prefers the version's display_name (appending
// the original extension if the user didn't include one), falling back to
// the versionedFilename heuristic.
function resolveDownloadFilename(
  originalFilename: string,
  displayName: string | null | undefined,
  versionNumber: number | null,
): string {
  const dot = originalFilename.lastIndexOf(".");
  const origExt = dot > 0 ? originalFilename.slice(dot) : "";
  if (displayName && displayName.trim()) {
    const trimmed = displayName.trim();
    const trimmedDot = trimmed.lastIndexOf(".");
    const hasExt =
      trimmedDot > 0 &&
      trimmed
        .slice(trimmedDot)
        .toLowerCase()
        .match(/^\.[a-z0-9]{1,6}$/);
    if (hasExt) return trimmed;
    return origExt ? `${trimmed}${origExt}` : trimmed;
  }
  return versionedFilename(originalFilename, versionNumber);
}

// GET /single-documents/:documentId/versions
// Returns every version row for the document in document order, with
// the human-friendly version number when present.
documentsRouter.get("/:documentId/versions", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId } = req.params;
  const db = createServerSupabase();

  const { data: doc } = await db
    .from("documents")
    .select("id, current_version_id, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (!doc)
    return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok)
    return void res.status(404).json({ detail: "Document not found" });

  const { data: rows } = await db
    .from("document_versions")
    .select("id, version_number, source, created_at, display_name")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  res.json({
    current_version_id: doc.current_version_id,
    versions: rows ?? [],
  });
});

// GET /single-documents/:documentId/editor-content
// Returns text-focused HTML for Tiptap plus the base version that must be
// supplied on save. Complex DOCX layout is intentionally flattened here.
documentsRouter.get("/:documentId/editor-content", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId } = req.params;
  const versionIdParam =
    typeof req.query.version_id === "string" ? req.query.version_id : null;
  const db = createServerSupabase();

  const { data: doc } = await db
    .from("documents")
    .select("id, filename, file_type, current_version_id, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (!doc)
    return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok)
    return void res.status(404).json({ detail: "Document not found" });
  if (doc.file_type !== "docx" && doc.file_type !== "doc") {
    return void res.status(400).json({ detail: "Only DOCX documents can be edited." });
  }

  const active = await loadActiveVersion(documentId, db, versionIdParam);
  if (!active)
    return void res.status(404).json({ detail: "No file available" });
  const raw = await downloadFile(active.storage_path);
  if (!raw)
    return void res.status(404).json({ detail: "Document bytes not available" });

  const { count: pendingCount } = await db
    .from("document_edits")
    .select("id", { count: "exact", head: true })
    .eq("version_id", active.id)
    .eq("status", "pending");

  let html = "";
  try {
    const mammoth = await import("mammoth");
    const result = await Promise.race([
      mammoth.convertToHtml({
        buffer: Buffer.from(raw),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("DOCX to editor conversion timed out.")),
          EDITOR_CONVERSION_TIMEOUT_MS,
        ),
      ),
    ]);
    html = result.value;
  } catch (err) {
    console.error("[editor-content] conversion failed", {
      documentId,
      versionId: active.id,
      filename: doc.filename,
      err,
    });
    return void res.status(422).json({
      detail:
        err instanceof Error
          ? err.message
          : "Document could not be converted for editing.",
    });
  }

  res.json({
    html: html || "<p></p>",
    base_version_id: active.id,
    version_number: active.version_number,
    pending_edit_count: pendingCount ?? 0,
    source_links: await loadDocumentSourceLinks(
      db,
      documentId,
      (doc.project_id as string | null) ?? null,
      active.id,
    ),
  });
});

// GET /single-documents/:documentId/source-references
documentsRouter.get("/:documentId/source-references", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId } = req.params;
  const versionId =
    typeof req.query.version_id === "string" ? req.query.version_id : null;
  const db = createServerSupabase();

  const { data: doc } = await db
    .from("documents")
    .select("id, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (!doc) return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok) return void res.status(404).json({ detail: "Document not found" });

  let query = db
    .from("source_references")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (versionId) query = query.eq("document_version_id", versionId);
  const { data, error } = await query;
  if (error) return void res.status(500).json({ detail: error.message });
  res.json(data ?? []);
});

// GET /single-documents/:documentId/source-links
documentsRouter.get("/:documentId/source-links", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId } = req.params;
  const versionId =
    typeof req.query.version_id === "string" ? req.query.version_id : null;
  const db = createServerSupabase();

  const { data: doc } = await db
    .from("documents")
    .select("id, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (!doc) return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok) return void res.status(404).json({ detail: "Document not found" });

  res.json(
    await loadDocumentSourceLinks(
      db,
      documentId,
      (doc.project_id as string | null) ?? null,
      versionId,
    ),
  );
});

// POST /single-documents/:documentId/editor-save
// Saves Tiptap JSON as a brand-new manual_edit version. It never overwrites
// the active version in place; stale editors and pending AI tracked changes
// are rejected to keep the assistant edit workflow consistent.
documentsRouter.post("/:documentId/editor-save", requireAuth, async (req, res) => {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId } = req.params;
  const db = createServerSupabase();

  const baseVersionId =
    typeof req.body?.base_version_id === "string" ? req.body.base_version_id : "";
  const content = req.body?.content as TiptapNode | undefined;
  if (!baseVersionId || !content || content.type !== "doc") {
    return void res.status(400).json({ detail: "base_version_id and Tiptap doc content are required." });
  }

  const { data: doc } = await db
    .from("documents")
    .select("id, filename, file_type, current_version_id, user_id, project_id")
    .eq("id", documentId)
    .single();
  if (!doc)
    return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok)
    return void res.status(404).json({ detail: "Document not found" });
  if (doc.file_type !== "docx" && doc.file_type !== "doc") {
    return void res.status(400).json({ detail: "Only DOCX documents can be edited." });
  }
  if (doc.current_version_id !== baseVersionId) {
    return void res.status(409).json({
      detail: "This document changed while the editor was open. Reload the document before saving.",
      code: "stale_version",
      current_version_id: doc.current_version_id,
    });
  }

  const { count: pendingCount } = await db
    .from("document_edits")
    .select("id", { count: "exact", head: true })
    .eq("version_id", baseVersionId)
    .eq("status", "pending");
  if ((pendingCount ?? 0) > 0) {
    return void res.status(409).json({
      detail: "Resolve pending AI changes before saving manual edits.",
      code: "pending_ai_edits",
      pending_edit_count: pendingCount ?? 0,
    });
  }

  const { data: baseVersion } = await db
    .from("document_versions")
    .select("id, display_name")
    .eq("id", baseVersionId)
    .eq("document_id", documentId)
    .single();
  if (!baseVersion)
    return void res.status(404).json({ detail: "Base version not found" });

  const buf = await tiptapJsonToDocxBuffer(content, doc.filename as string);
  const versionSlug = crypto.randomUUID().replace(/-/g, "");
  const key = versionStorageKey(userId, documentId, versionSlug, doc.filename as string);
  await uploadFile(
    key,
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );

  let pdfStoragePath: string | null = null;
  try {
    const pdfBuf = await docxToPdf(buf);
    const pdfKey = `converted-pdfs/${userId}/${documentId}/${versionSlug}.pdf`;
    await uploadFile(
      pdfKey,
      pdfBuf.buffer.slice(pdfBuf.byteOffset, pdfBuf.byteOffset + pdfBuf.byteLength) as ArrayBuffer,
      "application/pdf",
    );
    pdfStoragePath = pdfKey;
  } catch (err) {
    console.error(`[editor-save] DOCX→PDF conversion failed for ${doc.filename}:`, err);
  }

  const { data: maxRow } = await db
    .from("document_versions")
    .select("version_number")
    .eq("document_id", documentId)
    .in("source", VERSIONED_SOURCES)
    .order("version_number", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextVersionNumber = ((maxRow?.version_number as number | null) ?? 1) + 1;

  const { data: versionRow, error: verErr } = await db
    .from("document_versions")
    .insert({
      document_id: documentId,
      storage_path: key,
      pdf_storage_path: pdfStoragePath,
      source: "manual_edit",
      version_number: nextVersionNumber,
      display_name: (baseVersion.display_name as string | null) ?? (doc.filename as string),
    })
    .select("id, version_number, source, created_at, display_name")
    .single();
  if (verErr || !versionRow) {
    console.error("[editor-save] insert failed", verErr);
    return void res.status(500).json({ detail: "Failed to record manual edit version." });
  }

  await db
    .from("documents")
    .update({
      current_version_id: versionRow.id,
      size_bytes: buf.byteLength,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  res.status(201).json({
    ...versionRow,
    document_id: documentId,
    download_url: buildDownloadUrl(key, doc.filename as string),
  });
});

// POST /single-documents/:documentId/versions
// Upload a brand-new version of an existing document. The uploaded file
// becomes the new current_version_id. display_name defaults to the
// uploaded filename; client may override via the `display_name` form field.
documentsRouter.post(
  "/:documentId/versions",
  requireAuth,
  singleFileUpload("file"),
  async (req, res) => {
    const userId = res.locals.userId as string;
    const userEmail = res.locals.userEmail as string | undefined;
    const { documentId } = req.params;
    const db = createServerSupabase();

    const file = req.file;
    if (!file)
      return void res.status(400).json({ detail: "file is required" });

    const { data: doc } = await db
      .from("documents")
      .select("id, filename, file_type, user_id, project_id")
      .eq("id", documentId)
      .single();
    if (!doc)
      return void res.status(404).json({ detail: "Document not found" });
    const access = await ensureDocAccess(doc, userId, userEmail, db);
    if (!access.ok)
      return void res.status(404).json({ detail: "Document not found" });

    // Reject if the uploaded file's extension doesn't match the document's
    // declared type — otherwise every downstream viewer/extractor breaks.
    const suffix = file.originalname.includes(".")
      ? file.originalname.split(".").pop()!.toLowerCase()
      : "";
    if (doc.file_type && suffix && doc.file_type !== suffix) {
      return void res.status(400).json({
        detail: `Uploaded file type (${suffix}) does not match document type (${doc.file_type}).`,
      });
    }

    // Peg the new version into a predictable /versions/:id path under the
    // existing document folder so ops can spot the history in storage.
    const versionSlug = crypto.randomUUID().replace(/-/g, "");
    const key = versionStorageKey(
      userId,
      documentId,
      versionSlug,
      file.originalname,
    );
    const contentType =
      suffix === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    try {
      await uploadFile(
        key,
        file.buffer.buffer.slice(
          file.buffer.byteOffset,
          file.buffer.byteOffset + file.buffer.byteLength,
        ) as ArrayBuffer,
        contentType,
      );
    } catch (e) {
      console.error("[versions/upload] storage write failed", e);
      return void res
        .status(500)
        .json({ detail: "Failed to upload new version." });
    }

    // Render this version's bytes to PDF up front so /display can show
    // historical versions without on-demand conversion. Same logic as the
    // initial-upload pipeline; failures don't block the version row.
    let pdfStoragePath: string | null = null;
    if (suffix === "docx" || suffix === "doc") {
      try {
        const pdfBuf = await docxToPdf(file.buffer);
        const pdfKey = `converted-pdfs/${userId}/${documentId}/${versionSlug}.pdf`;
        await uploadFile(
          pdfKey,
          pdfBuf.buffer.slice(
            pdfBuf.byteOffset,
            pdfBuf.byteOffset + pdfBuf.byteLength,
          ) as ArrayBuffer,
          "application/pdf",
        );
        pdfStoragePath = pdfKey;
      } catch (err) {
        console.error(
          `[versions/upload] DOCX→PDF conversion failed for ${file.originalname}:`,
          err,
        );
      }
    } else if (suffix === "pdf") {
      // For PDF uploads, the uploaded bytes are themselves the PDF rendition.
      pdfStoragePath = key;
    }

    // Per-document sequential version_number — the upload is V1 and
    // user_upload + assistant_edit count forward from there.
    const { data: maxRow } = await db
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .in("source", VERSIONED_SOURCES)
      .order("version_number", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const nextVersionNumber =
      ((maxRow?.version_number as number | null) ?? 1) + 1;

    const defaultDisplayName =
      typeof req.body?.display_name === "string" &&
      req.body.display_name.trim()
        ? req.body.display_name.trim().slice(0, 200)
        : file.originalname;

    const { data: versionRow, error: verErr } = await db
      .from("document_versions")
      .insert({
        document_id: documentId,
        storage_path: key,
        pdf_storage_path: pdfStoragePath,
        source: "user_upload",
        version_number: nextVersionNumber,
        display_name: defaultDisplayName,
      })
      .select("id, version_number, source, created_at, display_name")
      .single();
    if (verErr || !versionRow) {
      console.error("[versions/upload] insert failed", verErr);
      return void res
        .status(500)
        .json({ detail: "Failed to record new version." });
    }

    // Also propagate the user-provided display_name to the parent document's
    // filename so the document's display name stays in sync across the UI.
    // Preserve a sensible extension: if the display_name has none, append
    // the uploaded file's extension (fallback: the existing doc's extension).
    const documentsUpdate: Record<string, unknown> = {
      current_version_id: versionRow.id,
    };
    const providedDisplayName =
      typeof req.body?.display_name === "string" &&
      req.body.display_name.trim()
        ? req.body.display_name.trim().slice(0, 200)
        : null;
    if (providedDisplayName) {
      const hasExt = /\.[a-z0-9]{1,6}$/i.test(providedDisplayName);
      const existingExt = (doc.filename as string | null)?.match(
        /\.[a-z0-9]{1,6}$/i,
      )?.[0];
      const uploadedExt = suffix ? `.${suffix}` : "";
      const ext = hasExt ? "" : uploadedExt || existingExt || "";
      documentsUpdate.filename = `${providedDisplayName}${ext}`;
    }
    await db
      .from("documents")
      .update(documentsUpdate)
      .eq("id", documentId);

    res.status(201).json(versionRow);
  },
);

// PATCH /single-documents/:documentId/versions/:versionId
// Rename a version's display_name. Pass `{ "display_name": "…" }`; an empty
// or missing value clears the override so the UI falls back to V{n}.
documentsRouter.patch(
  "/:documentId/versions/:versionId",
  requireAuth,
  async (req, res) => {
    const userId = res.locals.userId as string;
    const userEmail = res.locals.userEmail as string | undefined;
    const { documentId, versionId } = req.params;
    const db = createServerSupabase();

    const { data: doc } = await db
      .from("documents")
      .select("id, user_id, project_id")
      .eq("id", documentId)
      .single();
    if (!doc)
      return void res.status(404).json({ detail: "Document not found" });
    const access = await ensureDocAccess(doc, userId, userEmail, db);
    if (!access.ok)
      return void res.status(404).json({ detail: "Document not found" });

    const raw = req.body?.display_name;
    const displayName =
      typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 200) : null;

    const { data: updated, error } = await db
      .from("document_versions")
      .update({ display_name: displayName })
      .eq("id", versionId)
      .eq("document_id", documentId)
      .select("id, version_number, source, created_at, display_name")
      .single();
    if (error || !updated) {
      return void res.status(404).json({ detail: "Version not found" });
    }
    res.json(updated);
  },
);

// POST /single-documents/:documentId/versions/:versionId/restore
// Restores a previous version by creating a new manual_edit version that
// points at the selected version's bytes. This preserves an audit trail
// instead of moving current_version_id backwards invisibly.
documentsRouter.post(
  "/:documentId/versions/:versionId/restore",
  requireAuth,
  async (req, res) => {
    const userId = res.locals.userId as string;
    const userEmail = res.locals.userEmail as string | undefined;
    const { documentId, versionId } = req.params;
    const db = createServerSupabase();

    const { data: doc } = await db
      .from("documents")
      .select("id, filename, user_id, project_id")
      .eq("id", documentId)
      .single();
    if (!doc)
      return void res.status(404).json({ detail: "Document not found" });
    const access = await ensureDocAccess(doc, userId, userEmail, db);
    if (!access.ok)
      return void res.status(404).json({ detail: "Document not found" });

    const { data: target } = await db
      .from("document_versions")
      .select("id, storage_path, pdf_storage_path, version_number, display_name")
      .eq("id", versionId)
      .eq("document_id", documentId)
      .single();
    if (!target)
      return void res.status(404).json({ detail: "Version not found" });

    const { data: maxRow } = await db
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .in("source", VERSIONED_SOURCES)
      .order("version_number", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const nextVersionNumber = ((maxRow?.version_number as number | null) ?? 1) + 1;
    const targetLabel =
      typeof target.version_number === "number"
        ? `V${target.version_number}`
        : "previous version";

    const { data: restored, error: restoreErr } = await db
      .from("document_versions")
      .insert({
        document_id: documentId,
        storage_path: target.storage_path,
        pdf_storage_path: target.pdf_storage_path ?? null,
        source: "manual_edit",
        version_number: nextVersionNumber,
        display_name: `Restored to ${targetLabel}`,
      })
      .select("id, version_number, source, created_at, display_name")
      .single();
    if (restoreErr || !restored) {
      return void res.status(500).json({
        detail: restoreErr?.message ?? "Failed to restore version.",
      });
    }

    await db
      .from("documents")
      .update({
        current_version_id: restored.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    res.status(201).json({ ...restored, document_id: documentId });
  },
);

// GET /single-documents/:documentId/tracked-change-ids
// Returns the ordered list of { kind, w_id } for every w:ins / w:del in
// the current (or specified) version's document.xml. The frontend uses
// this to tag each rendered <ins>/<del> with data-w-id, since
// docx-preview drops the w:id attribute during parsing.
documentsRouter.get(
  "/:documentId/tracked-change-ids",
  requireAuth,
  async (req, res) => {
    const userId = res.locals.userId as string;
    const userEmail = res.locals.userEmail as string | undefined;
    const { documentId } = req.params;
    const versionIdParam =
      typeof req.query.version_id === "string" ? req.query.version_id : null;
    const db = createServerSupabase();

    const { data: doc } = await db
      .from("documents")
      .select("id, user_id, project_id")
      .eq("id", documentId)
      .single();
    if (!doc)
      return void res.status(404).json({ detail: "Document not found" });
    const access = await ensureDocAccess(doc, userId, userEmail, db);
    if (!access.ok)
      return void res.status(404).json({ detail: "Document not found" });

    const active = await loadActiveVersion(documentId, db, versionIdParam);
    if (!active)
      return void res.status(404).json({ detail: "No file available" });

    const raw = await downloadFile(active.storage_path);
    if (!raw)
      return void res
        .status(404)
        .json({ detail: "Document bytes not available" });

    const ids = await extractTrackedChangeIds(Buffer.from(raw));
    res.json({ ids });
  },
);

// POST /single-documents/:documentId/edits/:editId/accept
// POST /single-documents/:documentId/edits/:editId/reject
async function handleEditResolution(
  req: import("express").Request,
  res: import("express").Response,
  mode: "accept" | "reject",
) {
  const userId = res.locals.userId as string;
  const userEmail = res.locals.userEmail as string | undefined;
  const { documentId, editId } = req.params;
  const db = createServerSupabase();

  console.log(`[edit-resolution] incoming ${mode}`, {
    userId,
    documentId,
    editId,
  });

  const { data: edit, error: editErr } = await db
    .from("document_edits")
    .select("id, document_id, version_id, change_id, del_w_id, ins_w_id, status")
    .eq("id", editId)
    .eq("document_id", documentId)
    .single();
  console.log(`[edit-resolution] fetched edit row`, { edit, editErr });
  if (!edit) {
    console.log(`[edit-resolution] edit not found, returning 404`);
    return void res.status(404).json({ detail: "Edit not found" });
  }
  // Idempotent: if the edit is already resolved, return the current doc
  // state so stale UI (e.g. an old chat reloaded in a new session) can
  // reconcile without throwing.
  if (edit.status !== "pending") {
    console.log(`[edit-resolution] edit already resolved`, {
      editId,
      status: edit.status,
    });
    const { data: doc } = await db
      .from("documents")
      .select("current_version_id, filename, user_id, project_id")
      .eq("id", documentId)
      .single();
    if (!doc) {
      console.log(`[edit-resolution] doc not found for resolved edit`);
      return void res.status(404).json({ detail: "Document not found" });
    }
    const accessResolved = await ensureDocAccess(doc, userId, userEmail, db);
    if (!accessResolved.ok) {
      console.log(`[edit-resolution] doc access denied for resolved edit`);
      return void res.status(404).json({ detail: "Document not found" });
    }
    const activeForResolved = await loadActiveVersion(documentId, db);
    const payload = {
      ok: true,
      already_resolved: true,
      status: edit.status,
      version_id: doc.current_version_id ?? null,
      download_url: activeForResolved
        ? buildDownloadUrl(
            activeForResolved.storage_path,
            (doc.filename as string) ?? "document.docx",
          )
        : null,
      remaining_pending: 0,
    };
    console.log(`[edit-resolution] returning already-resolved payload`, payload);
    return void res.status(200).json(payload);
  }

  const { data: doc, error: docErr } = await db
    .from("documents")
    .select("id, filename, current_version_id, user_id, project_id")
    .eq("id", documentId)
    .single();
  console.log(`[edit-resolution] fetched doc`, { doc, docErr });
  if (!doc)
    return void res.status(404).json({ detail: "Document not found" });
  const access = await ensureDocAccess(doc, userId, userEmail, db);
  if (!access.ok)
    return void res.status(404).json({ detail: "Document not found" });

  const active = await loadActiveVersion(documentId, db);
  const latestPath = active?.storage_path ?? null;
  console.log(`[edit-resolution] resolved latestPath`, {
    latestPath,
    current_version_id: doc.current_version_id,
  });
  if (!latestPath)
    return void res.status(404).json({ detail: "No file to edit" });

  const raw = await downloadFile(latestPath);
  console.log(`[edit-resolution] downloaded bytes`, {
    byteLength: raw?.byteLength ?? 0,
  });
  if (!raw)
    return void res.status(404).json({ detail: "Document bytes not available" });

  const wIds = [edit.del_w_id, edit.ins_w_id].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const { bytes: resolvedBytes, found } = await resolveTrackedChange(
    Buffer.from(raw),
    wIds,
    mode,
  );
  console.log(`[edit-resolution] resolveTrackedChange result`, {
    mode,
    change_id: edit.change_id,
    wIds,
    found,
    resolvedByteLength: resolvedBytes?.byteLength ?? 0,
  });
  if (!found) {
    console.log(
      `[edit-resolution] change_id not found in docx — updating status only`,
    );
    // Still update DB status so the UI reflects the decision — the change
    // may have been auto-consumed by a previous accept/reject pass.
    const { error: updErr } = await db
      .from("document_edits")
      .update({ status: mode === "accept" ? "accepted" : "rejected", resolved_at: new Date().toISOString() })
      .eq("id", editId);
    console.log(`[edit-resolution] status-only update`, { updErr });
    await recordVerificationEvent(db, {
      userId,
      projectId: (doc.project_id as string | null) ?? null,
      documentId,
      documentVersionId: (doc.current_version_id as string | null) ?? null,
      eventType: mode === "accept" ? "edit_accepted" : "edit_rejected",
      eventLabel: `AI edit ${mode}ed`,
      relatedEditId: editId,
      status: "warning",
      metadata: { change_id: edit.change_id, found: false },
    });
    const { data: filenameRow } = await db
      .from("documents")
      .select("filename")
      .eq("id", documentId)
      .single();
    const payload = {
      ok: true,
      version_id: doc.current_version_id,
      download_url: buildDownloadUrl(
        latestPath,
        (filenameRow?.filename as string) ?? "document.docx",
      ),
      remaining_pending: 0,
    };
    console.log(`[edit-resolution] returning not-found payload`, payload);
    return void res.status(200).json(payload);
  }

  const ab = resolvedBytes.buffer.slice(
    resolvedBytes.byteOffset,
    resolvedBytes.byteOffset + resolvedBytes.byteLength,
  ) as ArrayBuffer;
  let responseVersionId = doc.current_version_id as string | null;
  let responseDownloadPath = latestPath;
  let responseVersionNumber = active?.version_number ?? null;

  if (mode === "accept") {
    const versionSlug = crypto.randomUUID().replace(/-/g, "");
    const filename = (doc.filename as string | null) ?? "document.docx";
    const key = versionStorageKey(userId, documentId, versionSlug, filename);
    await uploadFile(
      key,
      ab,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    let pdfStoragePath: string | null = null;
    try {
      const pdfBuf = await docxToPdf(Buffer.from(resolvedBytes));
      const pdfKey = `converted-pdfs/${userId}/${documentId}/${versionSlug}.pdf`;
      await uploadFile(
        pdfKey,
        pdfBuf.buffer.slice(pdfBuf.byteOffset, pdfBuf.byteOffset + pdfBuf.byteLength) as ArrayBuffer,
        "application/pdf",
      );
      pdfStoragePath = pdfKey;
    } catch (err) {
      console.error(`[edit-resolution] DOCX→PDF conversion failed for ${filename}:`, err);
    }

    const { data: maxRow } = await db
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .in("source", VERSIONED_SOURCES)
      .order("version_number", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const nextVersionNumber = ((maxRow?.version_number as number | null) ?? 1) + 1;
    const { data: versionRow, error: versionErr } = await db
      .from("document_versions")
      .insert({
        document_id: documentId,
        storage_path: key,
        pdf_storage_path: pdfStoragePath,
        source: "user_accept",
        version_number: nextVersionNumber,
        display_name: active?.display_name ?? filename,
      })
      .select("id, version_number")
      .single();
    if (versionErr || !versionRow) {
      console.error("[edit-resolution] user_accept version insert failed", versionErr);
      return void res.status(500).json({ detail: "Failed to record accepted edit version." });
    }
    await db
      .from("documents")
      .update({
        current_version_id: versionRow.id,
        size_bytes: resolvedBytes.byteLength,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);
    const { data: existingLinks } = await db
      .from("document_source_links")
      .select("source_reference_id, anchor_type, anchor_text, block_key, from_pos, to_pos")
      .eq("document_id", documentId)
      .eq("document_version_id", edit.version_id);
    if (existingLinks?.length) {
      await db.from("document_source_links").insert(
        existingLinks.map((link) => ({
          document_id: documentId,
          document_version_id: versionRow.id,
          source_reference_id: link.source_reference_id,
          anchor_type: link.anchor_type,
          anchor_text: link.anchor_text,
          block_key: link.block_key,
          from_pos: link.from_pos,
          to_pos: link.to_pos,
        })),
      );
    }
    responseVersionId = versionRow.id as string;
    responseVersionNumber = (versionRow.version_number as number | null) ?? null;
    responseDownloadPath = key;
  } else {
    // Reject keeps the existing assistant-edit version row but resolves the
    // tracked-change markup in place, preserving the current product flow.
    await uploadFile(
      latestPath,
      ab,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  }

  const { error: statusErr } = await db
    .from("document_edits")
    .update({
      status: mode === "accept" ? "accepted" : "rejected",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", editId);
  console.log(`[edit-resolution] updated document_edits status`, {
    editId,
    newStatus: mode === "accept" ? "accepted" : "rejected",
    statusErr,
  });

  await recordVerificationEvent(db, {
    userId,
    projectId: (doc.project_id as string | null) ?? null,
    documentId,
    documentVersionId: responseVersionId,
    eventType: mode === "accept" ? "edit_accepted" : "edit_rejected",
    eventLabel: `AI edit ${mode}ed`,
    relatedEditId: editId,
    metadata: { change_id: edit.change_id, found: true },
  });
  if (mode === "accept") {
    await recordVerificationEvent(db, {
      userId,
      projectId: (doc.project_id as string | null) ?? null,
      documentId,
      documentVersionId: responseVersionId,
      eventType: "document_version_created",
      eventLabel: "Accepted edit version created",
      relatedEditId: editId,
      metadata: { version_number: responseVersionNumber },
    });
  }

  const { count: remainingPending } = await db
    .from("document_edits")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId)
    .eq("status", "pending");
  console.log(`[edit-resolution] remaining pending count`, { remainingPending });

  const { data: filenameRow } = await db
    .from("documents")
    .select("filename")
    .eq("id", documentId)
    .single();
  const payload = {
    ok: true,
    version_id: responseVersionId,
    version_number: responseVersionNumber,
    download_url: buildDownloadUrl(
      responseDownloadPath,
      (filenameRow?.filename as string) ?? "document.docx",
    ),
    remaining_pending: remainingPending ?? 0,
  };
  console.log(`[edit-resolution] returning success payload`, payload);
  res.json(payload);
}

documentsRouter.post(
  "/:documentId/edits/:editId/accept",
  requireAuth,
  (req, res) => void handleEditResolution(req, res, "accept"),
);

documentsRouter.post(
  "/:documentId/edits/:editId/reject",
  requireAuth,
  (req, res) => void handleEditResolution(req, res, "reject"),
);

async function handleDocumentUpload(
  req: import("express").Request,
  res: import("express").Response,
  userId: string,
  projectId: string | null,
  db: ReturnType<typeof createServerSupabase>,
) {
  const file = req.file;
  if (!file) return void res.status(400).json({ detail: "file is required" });

  const filename = file.originalname;
  const suffix = filename.includes(".")
    ? filename.split(".").pop()!.toLowerCase()
    : "";
  if (!ALLOWED_TYPES.has(suffix))
    return void res
      .status(400)
      .json({
        detail: `Unsupported file type: ${suffix}. Allowed: pdf, docx, doc`,
      });

  const content = file.buffer;
  const { data: doc, error: insertErr } = await db
    .from("documents")
    .insert({
      project_id: projectId,
      user_id: userId,
      filename,
      file_type: suffix,
      size_bytes: content.byteLength,
      status: "processing",
    })
    .select("*")
    .single();
  if (insertErr || !doc)
    return void res
      .status(500)
      .json({ detail: "Failed to create document record" });

  try {
    const docId = doc.id as string;
    const key = storageKey(userId, docId, filename);
    const contentType =
      suffix === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    await uploadFile(
      key,
      content.buffer.slice(
        content.byteOffset,
        content.byteOffset + content.byteLength,
      ) as ArrayBuffer,
      contentType,
    );

    const rawBuf = content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength,
    ) as ArrayBuffer;
    const tree = await extractStructureTree(rawBuf, suffix, filename);
    const pageCount = suffix === "pdf" ? await countPdfPages(rawBuf) : null;

    // Convert DOCX/DOC → PDF for display. PDFs are their own rendition.
    let pdfStoragePath: string | null = null;
    if (suffix === "docx" || suffix === "doc") {
      try {
        const pdfBuf = await docxToPdf(content);
        const pdfKey = convertedPdfKey(userId, docId);
        await uploadFile(
          pdfKey,
          pdfBuf.buffer.slice(
            pdfBuf.byteOffset,
            pdfBuf.byteOffset + pdfBuf.byteLength,
          ) as ArrayBuffer,
          "application/pdf",
        );
        pdfStoragePath = pdfKey;
      } catch (err) {
        console.error(
          `[upload] DOCX→PDF conversion failed for ${filename}:`,
          err,
        );
      }
    } else if (suffix === "pdf") {
      pdfStoragePath = key;
    }

    // storage_path / pdf_storage_path live on document_versions now —
    // create the V1 "upload" row and point documents.current_version_id
    // at it.
    const { data: versionRow, error: verErr } = await db
      .from("document_versions")
      .insert({
        document_id: docId,
        storage_path: key,
        pdf_storage_path: pdfStoragePath,
        source: "upload",
        version_number: 1,
        display_name: filename,
      })
      .select("id")
      .single();
    if (verErr || !versionRow) {
      throw new Error(
        `Failed to record upload version: ${verErr?.message ?? "unknown"}`,
      );
    }

    await db
      .from("documents")
      .update({
        current_version_id: versionRow.id,
        size_bytes: content.byteLength,
        page_count: pageCount,
        structure_tree: tree ?? null,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId);

    const { data: updated } = await db
      .from("documents")
      .select("*")
      .eq("id", docId)
      .single();
    // Surface storage paths to the caller for backward compatibility.
    const responseDoc = updated
      ? { ...updated, storage_path: key, pdf_storage_path: pdfStoragePath }
      : updated;
    return void res.status(201).json(responseDoc);
  } catch (e) {
    await db.from("documents").update({ status: "error" }).eq("id", doc.id);
    return void res
      .status(500)
      .json({ detail: `Document processing failed: ${String(e)}` });
  }
}

async function countPdfPages(buf: ArrayBuffer): Promise<number | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs" as string);
    const pdf = await (
      pdfjsLib as unknown as {
        getDocument: (opts: unknown) => {
          promise: Promise<{ numPages: number }>;
        };
      }
    ).getDocument({ data: new Uint8Array(buf) }).promise;
    return pdf.numPages;
  } catch {
    return null;
  }
}

async function extractStructureTree(
  content: ArrayBuffer,
  fileType: string,
  _filename: string,
): Promise<unknown[] | null> {
  try {
    if (fileType === "pdf") {
      const pdfjsLib = await import(
        "pdfjs-dist/legacy/build/pdf.mjs" as string
      );
      const pdf = await (
        pdfjsLib as unknown as {
          getDocument: (opts: unknown) => {
            promise: Promise<{
              numPages: number;
              getOutline: () => Promise<{ title?: string }[]>;
            }>;
          };
        }
      ).getDocument({ data: new Uint8Array(content) }).promise;
      if (pdf.numPages <= 5) return null;
      const outline = await pdf.getOutline();
      if (outline?.length)
        return outline.map((item, i) => ({
          id: `h1-${i}`,
          title: item.title ?? `Item ${i + 1}`,
          level: 1,
          page_number: null,
          children: [],
        }));
      return Array.from({ length: pdf.numPages }, (_, i) => ({
        id: `page-${i + 1}`,
        title: `Page ${i + 1}`,
        level: 1,
        page_number: i + 1,
        children: [],
      }));
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(content),
      });
      const lines = result.value.split("\n").filter((l) => l.trim());
      const nodes = lines
        .slice(0, 30)
        .map((line, i) => ({
          id: `h1-${i}`,
          title: line.slice(0, 100),
          level: 1,
          page_number: null,
          children: [],
        }));
      return nodes.length ? nodes : null;
    }
  } catch {
    return null;
  }
}
