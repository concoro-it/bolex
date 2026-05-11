"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePenLine, Loader2, Plus } from "lucide-react";
import {
    createEditorDocument,
    listProjects,
} from "@/app/lib/mikeApi";
import { HeaderSearchBtn } from "@/app/components/shared/HeaderSearchBtn";
import { NewProjectModal } from "@/app/components/projects/NewProjectModal";
import type { MikeProject } from "@/app/components/shared/types";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function EditorLandingPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<MikeProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingForProjectId, setCreatingForProjectId] = useState<
        string | null
    >(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        listProjects()
            .then(setProjects)
            .catch(() => setProjects([]))
            .finally(() => setLoading(false));
    }, []);

    async function createDocument(project: MikeProject) {
        if (creatingForProjectId) return;
        setCreatingForProjectId(project.id);
        try {
            const doc = await createEditorDocument(
                project.id,
                "Yeni Doküman",
            );
            router.push(`/editor/projects/${project.id}/documents/${doc.id}`);
        } finally {
            setCreatingForProjectId(null);
        }
    }

    const q = search.toLowerCase();
    const filtered = projects.filter(
        (p) =>
            !q ||
            p.name.toLowerCase().includes(q) ||
            (p.cm_number ?? "").toLowerCase().includes(q),
    );

    return (
        <div className="flex h-full flex-1 flex-col bg-white">
            <div className="flex items-center justify-between px-8 py-4">
                <div>
                    <h1 className="font-serif text-2xl font-medium text-gray-900">
                        Editor
                    </h1>
                    <p className="mt-1 text-xs text-gray-500">
                        Proje seçip yeni bir hukuki doküman oluşturun.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <HeaderSearchBtn
                        value={search}
                        onChange={setSearch}
                        placeholder="Search projects..."
                    />
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex h-8 items-center gap-1.5 px-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
                    >
                        <Plus className="h-4 w-4" />
                        Project
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-200">
                <div className="flex h-8 items-center border-b border-gray-200 px-8 text-xs font-medium text-gray-500">
                    <div className="w-[360px] shrink-0">Project</div>
                    <div className="ml-auto w-28 shrink-0">Files</div>
                    <div className="w-28 shrink-0">Chats</div>
                    <div className="w-32 shrink-0">Created</div>
                    <div className="w-36 shrink-0" />
                </div>

                {loading ? (
                    <div className="space-y-0">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex h-12 items-center border-b border-gray-50 px-8"
                            >
                                <div className="h-3.5 w-64 rounded bg-gray-100 animate-pulse" />
                                <div className="ml-auto h-3 w-8 rounded bg-gray-100 animate-pulse" />
                                <div className="ml-20 h-3 w-8 rounded bg-gray-100 animate-pulse" />
                                <div className="ml-20 h-3 w-20 rounded bg-gray-100 animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="mx-auto flex max-w-xs flex-col items-start py-24">
                        <FilePenLine className="mb-4 h-8 w-8 text-gray-300" />
                        <p className="font-serif text-2xl font-medium text-gray-900">
                            Editor
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Önce bir proje oluşturun, sonra bu proje altında
                            yeni doküman yazmaya başlayın.
                        </p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white shadow-md transition-colors hover:bg-gray-700"
                        >
                            + Create project
                        </button>
                    </div>
                ) : (
                    filtered.map((project) => {
                        const busy = creatingForProjectId === project.id;
                        return (
                            <button
                                key={project.id}
                                onClick={() => void createDocument(project)}
                                disabled={!!creatingForProjectId}
                                className="group flex h-12 w-full items-center border-b border-gray-50 px-8 text-left transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-60"
                            >
                                <div className="flex w-[360px] shrink-0 items-center gap-2 min-w-0">
                                    <FilePenLine className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-700" />
                                    <div className="min-w-0">
                                        <div className="truncate text-sm text-gray-800">
                                            {project.name}
                                        </div>
                                        {project.cm_number ? (
                                            <div className="truncate text-xs text-gray-400">
                                                #{project.cm_number}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="ml-auto w-28 shrink-0 text-sm text-gray-500">
                                    {project.document_count ?? 0}
                                </div>
                                <div className="w-28 shrink-0 text-sm text-gray-500">
                                    {project.chat_count ?? 0}
                                </div>
                                <div className="w-32 shrink-0 text-sm text-gray-500">
                                    {formatDate(project.created_at)}
                                </div>
                                <div className="flex w-36 shrink-0 justify-end">
                                    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 group-hover:border-gray-300">
                                        {busy ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Plus className="h-3.5 w-3.5" />
                                        )}
                                        New document
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <NewProjectModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={(project) => {
                    setProjects((prev) => [project, ...prev]);
                    void createDocument(project);
                }}
            />
        </div>
    );
}
