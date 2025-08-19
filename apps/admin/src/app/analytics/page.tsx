"use client";

import dynamic from "next/dynamic";

const EnhancedAnalyticsDashboard = dynamic(
  () => import("@/components/analytics/enhanced-analytics-dashboard").then(mod => mod.EnhancedAnalyticsDashboard),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
    </div>
  }
);

export default function AnalyticsPage() {
  return <EnhancedAnalyticsDashboard />;
}
