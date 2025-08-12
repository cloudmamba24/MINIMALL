import { Suspense } from "react";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import EditorListClient from "./EditorListClient";

interface ConfigListItem {
  id: string;
  shop?: string | null;
  slug?: string | null;
  updatedAt?: string | Date | null;
}

export default function EditorIndexPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <EditorListClient />
    </Suspense>
  );
}


