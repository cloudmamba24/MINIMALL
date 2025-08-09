import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AnalyticsDashboard } from './analytics-dashboard';
import { AppProvider } from '@shopify/polaris';

// Mock analytics data
const mockAnalyticsData = {
  success: true,
  data: {
    timeframe: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-07T23:59:59Z',
      duration: '7d',
    },
    performance: {
      metrics: [
        {
          configId: 'demo-config',
          metric: 'LCP' as const,
          value: 1800,
          rating: 'good' as const,
          delta: 150,
          id: 'lcp-1',
          navigationType: 'navigate',
          timestamp: '2024-01-01T12:00:00Z',
          url: 'https://example.com/g/demo-shop',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          connection: '4g',
          viewport: { width: 1920, height: 1080 },
        },
        {
          configId: 'demo-config',
          metric: 'FID' as const,
          value: 75,
          rating: 'good' as const,
          delta: 25,
          id: 'fid-1',
          navigationType: 'navigate',
          timestamp: '2024-01-01T12:05:00Z',
          url: 'https://example.com/g/demo-shop',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          connection: '4g',
          viewport: { width: 375, height: 812 },
        },
      ],
      aggregates: {
        avgLcp: 2100,
        avgFid: 85,
        avgCls: 0.08,
        avgTtfb: 420,
        totalMetrics: 1250,
      },
    },
    analytics: {
      events: [
        {
          event: 'page_view',
          configId: 'demo-config',
          sessionId: 'session_123',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          referrer: 'https://instagram.com',
          utmSource: 'instagram',
          utmMedium: 'social',
          utmCampaign: 'summer_sale',
          timestamp: '2024-01-01T10:00:00Z',
        },
        {
          event: 'button_click',
          configId: 'demo-config',
          sessionId: 'session_123',
          properties: {
            button_text: 'Shop Now',
            section: 'hero',
          },
          timestamp: '2024-01-01T10:02:00Z',
        },
      ],
      eventCounts: {
        page_view: 450,
        button_click: 127,
        product_view: 89,
        link_click: 203,
      },
      uniqueSessions: 245,
      totalEvents: 869,
    },
  },
};

const emptyAnalyticsData = {
  success: true,
  data: {
    timeframe: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-07T23:59:59Z',
      duration: '7d',
    },
    performance: {
      metrics: [],
      aggregates: {
        avgLcp: 0,
        avgFid: 0,
        avgCls: 0,
        avgTtfb: 0,
        totalMetrics: 0,
      },
    },
    analytics: {
      events: [],
      eventCounts: {},
      uniqueSessions: 0,
      totalEvents: 0,
    },
  },
};

const highTrafficData = {
  success: true,
  data: {
    timeframe: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
      duration: '30d',
    },
    performance: {
      metrics: [],
      aggregates: {
        avgLcp: 1950,
        avgFid: 65,
        avgCls: 0.05,
        avgTtfb: 380,
        totalMetrics: 15750,
      },
    },
    analytics: {
      events: [],
      eventCounts: {
        page_view: 12500,
        button_click: 3400,
        product_view: 2890,
        link_click: 5200,
        form_submit: 890,
        video_play: 1200,
        social_click: 780,
      },
      uniqueSessions: 8900,
      totalEvents: 26860,
    },
  },
};

const meta: Meta<typeof AnalyticsDashboard> = {
  title: 'Admin/Analytics Dashboard',
  component: AnalyticsDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive analytics dashboard displaying performance metrics, user interactions, and site insights. Integrates with Sentry for error monitoring and provides real-time Web Vitals tracking.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AppProvider i18n={{}}>
        <div style={{ padding: '1rem', minHeight: '600px' }}>
          <Story />
        </div>
      </AppProvider>
    ),
  ],
  argTypes: {
    data: {
      description: 'Analytics data object containing performance metrics and user events',
    },
    configId: {
      description: 'Configuration ID to filter analytics data',
      control: 'text',
    },
    timeframe: {
      control: 'select',
      options: ['1h', '24h', '7d', '30d'],
      description: 'Time period for analytics data',
    },
    onTimeframeChange: {
      description: 'Callback when timeframe selection changes',
      action: 'timeframe-changed',
    },
    onRefresh: {
      description: 'Callback when data refresh is requested',
      action: 'data-refreshed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockAnalyticsData,
    configId: 'demo-config',
    timeframe: '7d',
    onTimeframeChange: (timeframe) => {
      console.log('Timeframe changed:', timeframe);
    },
    onRefresh: () => {
      console.log('Analytics data refreshed');
    },
  },
};

export const EmptyState: Story = {
  args: {
    data: emptyAnalyticsData,
    configId: 'empty-config',
    timeframe: '7d',
    onTimeframeChange: (timeframe) => {
      console.log('Timeframe changed:', timeframe);
    },
    onRefresh: () => {
      console.log('Analytics data refreshed');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard in empty state with no analytics data, showing placeholder content and empty state messaging.',
      },
    },
  },
};

export const HighTraffic: Story = {
  args: {
    data: highTrafficData,
    configId: 'busy-config',
    timeframe: '30d',
    onTimeframeChange: (timeframe) => {
      console.log('Timeframe changed:', timeframe);
    },
    onRefresh: () => {
      console.log('Analytics data refreshed');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard displaying high-traffic analytics with large numbers and multiple event types.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    data: null,
    configId: 'loading-config',
    timeframe: '7d',
    loading: true,
    onTimeframeChange: (timeframe) => {
      console.log('Timeframe changed:', timeframe);
    },
    onRefresh: () => {
      console.log('Analytics data refreshed');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard in loading state showing skeleton loaders and placeholders while data is being fetched.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    data: null,
    configId: 'error-config',
    timeframe: '7d',
    error: 'Failed to load analytics data. Please try again.',
    onTimeframeChange: (timeframe) => {
      console.log('Timeframe changed:', timeframe);
    },
    onRefresh: () => {
      console.log('Analytics data refreshed');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard in error state displaying error messages and retry options.',
      },
    },
  },
};

export const InteractiveDashboard: Story = {
  render: () => {
    const [timeframe, setTimeframe] = React.useState<'1h' | '24h' | '7d' | '30d'>('7d');
    const [data, setData] = React.useState(mockAnalyticsData);
    const [loading, setLoading] = React.useState(false);

    const handleTimeframeChange = (newTimeframe: '1h' | '24h' | '7d' | '30d') => {
      setTimeframe(newTimeframe);
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        // Update data based on timeframe
        const updatedData = {
          ...mockAnalyticsData,
          data: {
            ...mockAnalyticsData.data,
            timeframe: {
              ...mockAnalyticsData.data.timeframe,
              duration: newTimeframe,
            },
            analytics: {
              ...mockAnalyticsData.data.analytics,
              // Simulate different traffic levels based on timeframe
              totalEvents: newTimeframe === '1h' ? 25 : newTimeframe === '24h' ? 120 : newTimeframe === '7d' ? 869 : 3200,
              uniqueSessions: newTimeframe === '1h' ? 15 : newTimeframe === '24h' ? 85 : newTimeframe === '7d' ? 245 : 890,
            },
          },
        };
        setData(updatedData);
        setLoading(false);
      }, 1000);
    };

    const handleRefresh = () => {
      setLoading(true);
      setTimeout(() => {
        // Simulate refreshed data
        setData({
          ...data,
          data: {
            ...data.data,
            analytics: {
              ...data.data.analytics,
              totalEvents: data.data.analytics.totalEvents + Math.floor(Math.random() * 10),
            },
          },
        });
        setLoading(false);
      }, 800);
    };

    return (
      <div>
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong>Dashboard Controls:</strong>
            <div style={{ fontSize: '12px', marginTop: '0.25rem' }}>
              Current Timeframe: {timeframe} | Status: {loading ? 'Loading...' : 'Ready'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value as any)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #2563eb',
                borderRadius: '4px',
                background: '#2563eb',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '...' : 'Refresh'}
            </button>
          </div>
        </div>
        <AnalyticsDashboard
          data={loading ? null : data}
          configId="interactive-config"
          timeframe={timeframe}
          loading={loading}
          onTimeframeChange={handleTimeframeChange}
          onRefresh={handleRefresh}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive dashboard with working timeframe switching, refresh functionality, and simulated data loading.',
      },
    },
  },
};

export const DashboardFeatures: Story = {
  render: () => (
    <AppProvider i18n={{}}>
      <div style={{ padding: '1rem' }}>
        <h3>Analytics Dashboard Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2563eb' }}>📊 Performance Metrics</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Core Web Vitals (LCP, FID, CLS)</li>
              <li>Time to First Byte (TTFB)</li>
              <li>Real User Monitoring (RUM)</li>
              <li>Performance scoring</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>📈 User Analytics</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Page views and sessions</li>
              <li>User interactions tracking</li>
              <li>UTM campaign analysis</li>
              <li>Referrer insights</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>🔧 Technical Features</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Sentry integration</li>
              <li>Real-time data updates</li>
              <li>Multiple timeframe views</li>
              <li>Error monitoring</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbf0', border: '1px solid #f59e0b', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>🎯 Business Insights</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
            The analytics dashboard provides actionable insights for Shopify merchants including conversion tracking, 
            performance optimization recommendations, and user behavior analysis to improve their link-in-bio effectiveness 
            and drive more sales through their MINIMALL sites.
          </p>
        </div>
      </div>
    </AppProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive overview of the Analytics Dashboard\'s capabilities and business value.',
      },
    },
  },
};