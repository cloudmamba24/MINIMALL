'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shopify/polaris';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PerformanceMetric {
  id: number;
  configId: string;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  loadTime: number | null;
  timestamp: string;
  userAgent: string | null;
  connection: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
}

interface AnalyticsEvent {
  id: string;
  event: string;
  configId: string;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: string;
  userAgent: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

interface AnalyticsData {
  timeframe: {
    startDate: string;
    endDate: string;
    duration: string;
  };
  performance: {
    metrics: PerformanceMetric[];
    aggregates: {
      avgLcp: number;
      avgFid: number;
      avgCls: number;
      avgTtfb: number;
      totalMetrics: number;
    };
  };
  analytics: {
    events: AnalyticsEvent[];
    eventCounts: Record<string, number>;
    uniqueSessions: number;
    totalEvents: number;
  };
}

interface AnalyticsDashboardProps {
  configId?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ configId }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeframe,
        ...(configId && { configId }),
      });

      const response = await fetch(`/api/analytics/data?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, configId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No analytics data found for the selected time period.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const performanceChartData = data.performance.metrics
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(metric => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      LCP: metric.lcp,
      FID: metric.fid,
      CLS: metric.cls ? metric.cls / 1000 : null, // Convert back to decimal
      TTFB: metric.ttfb,
    }));

  const eventChartData = Object.entries(data.analytics.eventCounts).map(([event, count]) => ({
    event,
    count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">
            {data.timeframe.startDate} - {data.timeframe.endDate}
          </p>
        </div>
        <div className="flex gap-2">
          {(['1h', '24h', '7d', '30d'] as const).map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded text-sm ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average LCP</CardDescription>
            <CardTitle className="text-2xl">
              {Math.round(data.performance.aggregates.avgLcp)}ms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.performance.aggregates.avgLcp <= 2500 ? '✅ Good' : 
               data.performance.aggregates.avgLcp <= 4000 ? '⚠️ Needs improvement' : '❌ Poor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average FID</CardDescription>
            <CardTitle className="text-2xl">
              {Math.round(data.performance.aggregates.avgFid)}ms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.performance.aggregates.avgFid <= 100 ? '✅ Good' : 
               data.performance.aggregates.avgFid <= 300 ? '⚠️ Needs improvement' : '❌ Poor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average CLS</CardDescription>
            <CardTitle className="text-2xl">
              {data.performance.aggregates.avgCls.toFixed(3)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.performance.aggregates.avgCls <= 0.1 ? '✅ Good' : 
               data.performance.aggregates.avgCls <= 0.25 ? '⚠️ Needs improvement' : '❌ Poor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sessions</CardDescription>
            <CardTitle className="text-2xl">
              {data.analytics.uniqueSessions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.analytics.totalEvents} total events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics Over Time</CardTitle>
          <CardDescription>
            Core Web Vitals metrics for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="LCP" stroke="#8884d8" name="LCP (ms)" />
                <Line type="monotone" dataKey="FID" stroke="#82ca9d" name="FID (ms)" />
                <Line type="monotone" dataKey="TTFB" stroke="#ffc658" name="TTFB (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Events Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Events by Type</CardTitle>
            <CardDescription>Distribution of analytics events</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={eventChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
            <CardDescription>Proportional view of events</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={eventChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ event, percent }) => `${event} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {eventChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest analytics events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Config ID</th>
                  <th className="text-left p-2">Session</th>
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">Properties</th>
                </tr>
              </thead>
              <tbody>
                {data.analytics.events.slice(0, 10).map(event => (
                  <tr key={event.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{event.event}</td>
                    <td className="p-2 text-gray-600">{event.configId}</td>
                    <td className="p-2 text-gray-600 font-mono text-xs">
                      {event.sessionId.slice(-8)}
                    </td>
                    <td className="p-2 text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="p-2 text-gray-600 text-xs">
                      {JSON.stringify(event.properties)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};