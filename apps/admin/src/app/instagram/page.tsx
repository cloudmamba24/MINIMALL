"use client";

import dynamic from "next/dynamic";

const InstagramIntegration = dynamic(
  () => import("@/components/instagram/instagram-integration").then(mod => mod.InstagramIntegration),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }
);

export default function InstagramPage() {
  const handleConnect = async (accessToken: string) => {
    console.log("Instagram connected with token:", accessToken);
    // Here you would save the access token to your backend
  };

  const handleDisconnect = async () => {
    console.log("Instagram disconnected");
    // Here you would remove the access token from your backend
  };

  const handleImport = async (posts: any[]) => {
    console.log("Importing posts:", posts);
    // Here you would send the selected posts to your backend for import
    // Convert Instagram posts to your Tile format and save them
  };

  return (
    <InstagramIntegration
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onImport={handleImport}
    />
  );
}