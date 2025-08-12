import { Suspense } from "react";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import CreateNewClient from "./CreateNewClient";

export default function EditorNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Creating…</div>}>
      <CreateNewClient />
    </Suspense>
  );
}
