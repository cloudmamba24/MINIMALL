import { Suspense } from "react";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import EditorListClient from "./EditorListClient";

// Removed unused interface flagged by linter

export default function EditorIndexPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <EditorListClient />
    </Suspense>
  );
}
