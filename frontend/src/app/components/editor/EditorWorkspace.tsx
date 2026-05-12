"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    FilePenLine,
    FileText,
    Loader2,
    Plus,
} from "lucide-react";
import {
    createEditorDocument,
    createProjectFolder,
    deleteDocument,
    deleteProjectFolder,
    getProject,
    moveDocumentToFolder,
    moveSubfolderToFolder,
    renameProjectFolder,
} from "@/app/lib/mikeApi";
import { useAssistantChat } from "@/app/hooks/useAssistantChat";
import { ProjectExplorer } from "@/app/components/projects/ProjectExplorer";
import { DocView } from "@/app/components/shared/DocView";
import { DocxTiptapEditor } from "@/app/components/shared/DocxTiptapEditor";
import { AssistantMessage } from "@/app/components/assistant/AssistantMessage";
import { ChatInput } from "@/app/components/assistant/ChatInput";
import type { ChatInputHandle } from "@/app/components/assistant/ChatInput";
import { UserMessage } from "@/app/components/assistant/UserMessage";
import { BolexLogoIcon } from "@/components/chat/mike-icon";
import { useSidebar } from "@/app/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { invalidateDocxBytes } from "@/app/hooks/useFetchDocxBytes";
import type {
    MikeDocument,
    MikeMessage,
    MikeProject,
} from "@/app/components/shared/types";

interface Props {
    projectId: string;
    documentId: string;
}

const EXPLORER_DEFAULT = 280;
const EXPLORER_MIN = 180;
const ASSISTANT_DEFAULT = 420;
const ASSISTANT_MIN = 320;

function isDocx(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext === "docx" || ext === "doc";
}

function Divider({ onDrag }: { onDrag: (dx: number) => void }) {
    const dragging = useRef(false);
    const lastX = useRef(0);

    useEffect(() => {
        function move(e: MouseEvent) {
            if (!dragging.current) return;
            onDrag(e.clientX - lastX.current);
            lastX.current = e.clientX;
        }
        function up() {
            dragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, [onDrag]);

    return (
        <div className="relative w-0 shrink-0 z-10">
            <div
                onMouseDown={(e) => {
                    dragging.current = true;
                    lastX.current = e.clientX;
                    document.body.style.cursor = "col-resize";
                    document.body.style.userSelect = "none";
                }}
                className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize"
            />
        </div>
    );
}

function AssistantGreeting({ username }: { username: string }) {
    return (
        <div className="flex flex-1 items-center justify-center px-6">
            <div className="text-center">
                <BolexLogoIcon size={28} />
                <p className="mt-3 font-serif text-xl text-gray-900">
                    Hi, {username}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    Ask the assistant to draft, revise, or reason over the open
                    document.
                </p>
            </div>
        </div>
    );
}

function EditorAssistantPanel({
    project,
    activeDoc,
    width,
    onProjectDocumentsChanged,
    onOpenDocument,
}: {
    project: MikeProject | null;
    activeDoc: MikeDocument | null;
    width: number;
    onProjectDocumentsChanged: (focusDocumentId?: string | null) => void;
    onOpenDocument: (documentId: string) => void;
}) {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const chatInputRef = useRef<ChatInputHandle | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const username =
        profile?.displayName?.trim() || user?.email?.split("@")[0] || "there";

    if (!project) {
        return (
            <div
                style={{ width }}
                className="flex shrink-0 items-center justify-center border-l border-gray-200 bg-white"
            >
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <EditorAssistantThread
            key={project.id}
            project={project}
            activeDoc={activeDoc}
            width={width}
            username={username}
            chatInputRef={chatInputRef}
            messagesContainerRef={messagesContainerRef}
            onProjectDocumentsChanged={onProjectDocumentsChanged}
            onOpenDocument={onOpenDocument}
        />
    );
}

function EditorAssistantThread({
    project,
    activeDoc,
    width,
    username,
    chatInputRef,
    messagesContainerRef,
    onProjectDocumentsChanged,
    onOpenDocument,
}: {
    project: MikeProject;
    activeDoc: MikeDocument | null;
    width: number;
    username: string;
    chatInputRef: RefObject<ChatInputHandle | null>;
    messagesContainerRef: RefObject<HTMLDivElement | null>;
    onProjectDocumentsChanged: (focusDocumentId?: string | null) => void;
    onOpenDocument: (documentId: string) => void;
}) {
    const { messages, isResponseLoading, handleChat, cancel } =
        useAssistantChat({ projectId: project.id });
    const lastMutationSignatureRef = useRef("");

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages.length, messagesContainerRef]);

    const submit = useCallback(
        (message: MikeMessage) =>
            handleChat(message, {
                displayedDoc: activeDoc
                    ? {
                          filename: activeDoc.filename,
                          documentId: activeDoc.id,
                      }
                    : null,
            }),
        [activeDoc, handleChat],
    );

    const projectMutation = useMemo(() => {
        const parts: string[] = [];
        let focusDocumentId: string | null = null;
        for (const msg of messages) {
            for (const event of msg.events ?? []) {
                if ("isStreaming" in event && event.isStreaming) continue;
                if (event.type === "doc_created" && event.document_id) {
                    parts.push(
                        `created:${event.document_id}:${event.version_id ?? ""}`,
                    );
                    focusDocumentId = event.document_id;
                }
                if (event.type === "doc_edited" && event.document_id) {
                    parts.push(
                        `edited:${event.document_id}:${event.version_id ?? ""}:${event.version_number ?? ""}`,
                    );
                    focusDocumentId = event.document_id;
                }
                if (event.type === "doc_replicated") {
                    for (const copy of event.copies ?? []) {
                        parts.push(
                            `replicated:${copy.document_id}:${copy.version_id}`,
                        );
                        focusDocumentId = copy.document_id;
                    }
                }
            }
        }
        return {
            signature: parts.sort().join("|"),
            focusDocumentId,
        };
    }, [messages]);

    useEffect(() => {
        if (!projectMutation.signature) return;
        if (lastMutationSignatureRef.current === projectMutation.signature)
            return;
        lastMutationSignatureRef.current = projectMutation.signature;
        onProjectDocumentsChanged(projectMutation.focusDocumentId);
    }, [onProjectDocumentsChanged, projectMutation]);

    return (
        <div
            style={{ width }}
            className="flex shrink-0 flex-col border-l border-gray-200 bg-white"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const docId = e.dataTransfer.getData("application/mike-doc");
                const doc = project.documents?.find((d) => d.id === docId);
                if (doc) chatInputRef.current?.addDoc(doc);
            }}
        >
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
                <BolexLogoIcon size={16} />
                <span className="text-xs text-gray-700">Project Assistant</span>
            </div>

            {messages.length === 0 ? (
                <AssistantGreeting username={username} />
            ) : (
                <div
                    ref={messagesContainerRef}
                    className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
                >
                    {messages.map((msg, i) =>
                        msg.role === "user" ? (
                            <UserMessage
                                key={i}
                                content={msg.content ?? ""}
                                files={msg.files}
                            />
                        ) : (
                            <AssistantMessage
                                key={i}
                                content={msg.content ?? ""}
                                events={msg.events}
                                annotations={msg.annotations}
                                isStreaming={
                                    i === messages.length - 1 &&
                                    isResponseLoading
                                }
                                onOpenDocument={(args) =>
                                    onOpenDocument(args.documentId)
                                }
                                onCitationClick={() => {}}
                                onEditViewClick={() => {}}
                                isDocReloading={() => false}
                            />
                        ),
                    )}
                </div>
            )}

            <div className="shrink-0 px-4 pb-4">
                <ChatInput
                    ref={chatInputRef}
                    onSubmit={submit}
                    onCancel={cancel}
                    isLoading={isResponseLoading}
                    hideAddDocButton
                    projectName={project.name}
                    projectCmNumber={project.cm_number}
                />
            </div>
        </div>
    );
}

export function EditorWorkspace({ projectId, documentId }: Props) {
    const router = useRouter();
    const { setSidebarOpen } = useSidebar();
    const [project, setProject] = useState<MikeProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatingDoc, setCreatingDoc] = useState(false);
    const [explorerWidth, setExplorerWidth] = useState(EXPLORER_DEFAULT);
    const [assistantWidth, setAssistantWidth] = useState(ASSISTANT_DEFAULT);
    const [explorerCollapsed, setExplorerCollapsed] = useState(false);
    const [dirtyDocIds, setDirtyDocIds] = useState<Set<string>>(
        () => new Set(),
    );

    useEffect(() => {
        setSidebarOpen(false);
    }, [setSidebarOpen]);

    useEffect(() => {
        setLoading(true);
        getProject(projectId)
            .then(setProject)
            .catch(() => setProject(null))
            .finally(() => setLoading(false));
    }, [projectId]);

    const activeDoc = useMemo(
        () => project?.documents?.find((d) => d.id === documentId) ?? null,
        [documentId, project?.documents],
    );

    const refreshProject = useCallback(
        async (focusDocumentId?: string | null) => {
            const updated = await getProject(projectId);
            setProject(updated);
            if (
                focusDocumentId &&
                updated.documents?.some((doc) => doc.id === focusDocumentId)
            ) {
                router.push(
                    `/editor/projects/${projectId}/documents/${focusDocumentId}`,
                );
            }
        },
        [projectId, router],
    );

    async function handleCreateDocument() {
        if (creatingDoc) return;
        setCreatingDoc(true);
        try {
            const doc = await createEditorDocument(projectId, "Yeni Doküman");
            setProject((prev) =>
                prev
                    ? {
                          ...prev,
                          documents: [doc, ...(prev.documents ?? [])],
                      }
                    : prev,
            );
            router.push(`/editor/projects/${projectId}/documents/${doc.id}`);
        } finally {
            setCreatingDoc(false);
        }
    }

    function openDoc(doc: MikeDocument) {
        router.push(`/editor/projects/${projectId}/documents/${doc.id}`);
    }

    async function handleCreateFolder(parentId: string | null, name: string) {
        const folder = await createProjectFolder(projectId, name, parentId);
        setProject((prev) =>
            prev
                ? { ...prev, folders: [...(prev.folders ?? []), folder] }
                : prev,
        );
    }

    async function handleRenameFolder(folderId: string, name: string) {
        await renameProjectFolder(projectId, folderId, name);
        setProject((prev) =>
            prev
                ? {
                      ...prev,
                      folders: (prev.folders ?? []).map((f) =>
                          f.id === folderId ? { ...f, name } : f,
                      ),
                  }
                : prev,
        );
    }

    async function handleDeleteFolder(folderId: string) {
        await deleteProjectFolder(projectId, folderId);
        setProject((prev) =>
            prev
                ? {
                      ...prev,
                      folders: (prev.folders ?? []).filter(
                          (f) => f.id !== folderId,
                      ),
                      documents: (prev.documents ?? []).map((d) =>
                          d.folder_id === folderId
                              ? { ...d, folder_id: null }
                              : d,
                      ),
                  }
                : prev,
        );
    }

    async function handleMoveDoc(docId: string, folderId: string | null) {
        setProject((prev) =>
            prev
                ? {
                      ...prev,
                      documents: (prev.documents ?? []).map((d) =>
                          d.id === docId ? { ...d, folder_id: folderId } : d,
                      ),
                  }
                : prev,
        );
        await moveDocumentToFolder(projectId, docId, folderId);
    }

    async function handleMoveFolder(folderId: string, parentId: string | null) {
        setProject((prev) =>
            prev
                ? {
                      ...prev,
                      folders: (prev.folders ?? []).map((f) =>
                          f.id === folderId
                              ? { ...f, parent_folder_id: parentId }
                              : f,
                      ),
                  }
                : prev,
        );
        await moveSubfolderToFolder(projectId, folderId, parentId);
    }

    async function handleDeleteDoc(docId: string) {
        await deleteDocument(docId);
        const remaining =
            project?.documents?.filter((d) => d.id !== docId) ?? [];
        setProject((prev) =>
            prev ? { ...prev, documents: remaining } : prev,
        );
        if (docId === documentId) {
            const fallback = remaining.find((d) => isDocx(d.filename));
            if (fallback) {
                router.push(
                    `/editor/projects/${projectId}/documents/${fallback.id}`,
                );
            } else {
                router.push("/editor");
            }
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-white">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-full items-center justify-center bg-white">
                <p className="text-sm text-gray-400">Project not found</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-8">
                <div className="flex min-w-0 items-center gap-1.5 font-serif text-2xl font-medium">
                    <button
                        onClick={() => router.push("/editor")}
                        className="text-gray-400 transition-colors hover:text-gray-600"
                    >
                        Editor
                    </button>
                    <span className="text-gray-300">›</span>
                    <span className="truncate text-gray-700">
                        {project.name}
                    </span>
                    {activeDoc ? (
                        <>
                            <span className="text-gray-300">›</span>
                            <span className="truncate text-gray-900">
                                {activeDoc.filename}
                            </span>
                        </>
                    ) : null}
                </div>
                <button
                    onClick={() => void handleCreateDocument()}
                    disabled={creatingDoc}
                    className="inline-flex h-8 items-center gap-1.5 px-2 text-sm text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-40"
                >
                    {creatingDoc ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    Document
                </button>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {!explorerCollapsed ? (
                    <>
                        <div
                            style={{ width: explorerWidth }}
                            className="flex shrink-0 flex-col border-r border-gray-200"
                        >
                            <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-200 px-3">
                                <span className="text-xs text-gray-700">
                                    Documents
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            void handleCreateDocument()
                                        }
                                        disabled={creatingDoc}
                                        title="New editor document"
                                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                                    >
                                        {creatingDoc ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <FilePenLine className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setExplorerCollapsed(true)
                                        }
                                        title="Collapse documents"
                                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <ProjectExplorer
                                    projectName={project.name}
                                    documents={project.documents ?? []}
                                    folders={project.folders ?? []}
                                    selectedDocId={documentId}
                                    onDocClick={openDoc}
                                    onCreateFolder={handleCreateFolder}
                                    onRenameFolder={handleRenameFolder}
                                    onDeleteFolder={handleDeleteFolder}
                                    onDeleteDoc={handleDeleteDoc}
                                    onMoveDoc={handleMoveDoc}
                                    onMoveFolder={handleMoveFolder}
                                />
                            </div>
                        </div>
                        <Divider
                            onDrag={(dx) =>
                                setExplorerWidth((w) =>
                                    Math.max(EXPLORER_MIN, w + dx),
                                )
                            }
                        />
                    </>
                ) : (
                    <div className="flex shrink-0 flex-col border-r border-gray-200">
                        <div className="flex h-10 items-center justify-center border-b border-gray-200 px-1">
                            <button
                                onClick={() => setExplorerCollapsed(false)}
                                title="Expand documents"
                                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                <main className="flex min-w-0 flex-1 flex-col bg-gray-100">
                    {activeDoc ? (
                        isDocx(activeDoc.filename) ? (
                            <DocxTiptapEditor
                                key={activeDoc.id}
                                documentId={activeDoc.id}
                                versionId={undefined}
                                filename={activeDoc.filename}
                                rounded={false}
                                bordered={false}
                                autoSave
                                onDirtyChange={(dirty) => {
                                    setDirtyDocIds((prev) => {
                                        const next = new Set(prev);
                                        if (dirty) next.add(activeDoc.id);
                                        else next.delete(activeDoc.id);
                                        return next;
                                    });
                                }}
                                onSaved={(version) => {
                                    invalidateDocxBytes(activeDoc.id);
                                    setDirtyDocIds((prev) => {
                                        const next = new Set(prev);
                                        next.delete(activeDoc.id);
                                        return next;
                                    });
                                    setProject((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  documents: (
                                                      prev.documents ?? []
                                                  ).map((doc) =>
                                                      doc.id === activeDoc.id
                                                          ? {
                                                                ...doc,
                                                                current_version_id:
                                                                    version.id,
                                                                latest_version_number:
                                                                    version.version_number ??
                                                                    doc.latest_version_number,
                                                            }
                                                          : doc,
                                                  ),
                                              }
                                            : prev,
                                    );
                                }}
                            />
                        ) : (
                            <div className="flex min-h-0 flex-1 flex-col">
                                <div className="flex h-10 shrink-0 items-center border-b border-gray-200 bg-white px-3">
                                    <FileText className="mr-2 h-4 w-4 text-gray-400" />
                                    <span className="truncate text-sm text-gray-700">
                                        {activeDoc.filename}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400">
                                        Preview only
                                    </span>
                                </div>
                                <DocView
                                    doc={{ document_id: activeDoc.id }}
                                    rounded={false}
                                    bordered={false}
                                />
                            </div>
                        )
                    ) : (
                        <div className="flex h-full items-center justify-center px-8">
                            <div className="text-center">
                                <FilePenLine className="mx-auto mb-4 h-8 w-8 text-gray-300" />
                                <p className="font-serif text-xl text-gray-800">
                                    No document selected
                                </p>
                                <button
                                    onClick={() => void handleCreateDocument()}
                                    className="mt-4 inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-700"
                                >
                                    + New document
                                </button>
                            </div>
                        </div>
                    )}
                    {dirtyDocIds.size > 0 ? null : null}
                </main>

                <Divider
                    onDrag={(dx) =>
                        setAssistantWidth((w) =>
                            Math.max(ASSISTANT_MIN, w - dx),
                        )
                    }
                />
                <EditorAssistantPanel
                    project={project}
                    activeDoc={activeDoc}
                    width={assistantWidth}
                    onProjectDocumentsChanged={(focusDocumentId) => {
                        void refreshProject(focusDocumentId);
                    }}
                    onOpenDocument={(nextDocumentId) => {
                        router.push(
                            `/editor/projects/${projectId}/documents/${nextDocumentId}`,
                        );
                    }}
                />
            </div>
        </div>
    );
}
