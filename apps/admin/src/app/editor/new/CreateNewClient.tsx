"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const create = async () => {
      const host = searchParams.get("host");
      const shop = searchParams.get("shop");
      const qs = new URLSearchParams();
      if (host) qs.set("host", host);
      if (shop) qs.set("shop", shop);
      if (shop) qs.set("shopDomain", shop);

      const res = await fetch(`/api/configs?${qs.toString()}`, { method: "POST" });
      if (!res.ok) {
        router.replace(`/${qs.toString() ? `?${qs.toString()}` : ""}`);
        return;
      }
      const data = await res.json();
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      router.replace(`/editor/${data.configId}${suffix}`);
    };
    create();
  }, [router, searchParams]);

  return null;
}


