import dynamic from "next/dynamic";

const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics-dashboard").then(mod => mod.AnalyticsDashboard),
  { 
    ssr: false,
    loading: () => <div className="container mx-auto px-4 py-6">Loading analytics...</div>
  }
);

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <AnalyticsDashboard />
    </div>
  );
}
