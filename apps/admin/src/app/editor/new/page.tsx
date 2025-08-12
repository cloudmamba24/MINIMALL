"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Frame, Loading, Page } from "@shopify/polaris";

export default function EditorNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const create = async () => {
      const host = searchParams.get("host");
      const shop = searchParams.get("shop");
      const qs = new URLSearchParams();
      if (host) qs.set("host", host);
      if (shop) qs.set("shop", shop);

      // Prefer explicit shop; fallback to host decode handled by API
      if (shop) qs.set("shopDomain", shop);

      const res = await fetch(`/api/configs?${qs.toString()}`, { method: "POST" });
      if (!res.ok) {
        // Go back to home with error state
        router.replace(`/${qs.toString() ? `?${qs.toString()}` : ""}`);
        return;
      }
      const data = await res.json();
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      router.replace(`/editor/${data.configId}${suffix}`);
    };
    create();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Frame>
      <Page title="Creating page" subtitle="Please wait...">
        <Loading />
      </Page>
    </Frame>
  );
}


