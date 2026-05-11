"use client";

import { use } from "react";
import { EditorWorkspace } from "@/app/components/editor/EditorWorkspace";

interface Props {
    params: Promise<{ projectId: string; documentId: string }>;
}

export default function EditorDocumentPage({ params }: Props) {
    const { projectId, documentId } = use(params);
    return <EditorWorkspace projectId={projectId} documentId={documentId} />;
}
