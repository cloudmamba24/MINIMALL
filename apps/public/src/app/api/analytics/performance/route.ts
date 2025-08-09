import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { db, performanceMetrics } from '@repo/db';

const performanceMetricSchema = z.object({
  configId: z.string().optional(),
  metric: z.enum(['LCP', 'FID', 'CLS', 'FCP', 'TTFB']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  delta: z.number(),
  id: z.string(),
  navigationType: z.string(),
  timestamp: z.string(),
  url: z.string(),
  userAgent: z.string().optional(),
  connection: z.string().optional(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = performanceMetricSchema.parse(body);

    // Add Sentry context
    Sentry.withScope((scope) => {
      scope.setTag('metric_type', data.metric);
      scope.setTag('metric_rating', data.rating);
      scope.setContext('performance_metric', {
        metric: data.metric,
        value: data.value,
        rating: data.rating,
        configId: data.configId,
        url: data.url,
      });

      // Log performance metrics
      console.log(`Performance Metric: ${data.metric} = ${data.value}ms (${data.rating})`, {
        configId: data.configId,
        url: data.url,
        timestamp: data.timestamp,
      });

      // Save to database
      if (db) {
        try {
          const metricData: any = {
            configId: data.configId,
            timestamp: new Date(data.timestamp),
            userAgent: data.userAgent,
            connection: data.connection,
            viewportWidth: data.viewport?.width,
            viewportHeight: data.viewport?.height,
          };

          // Set the specific metric field based on the metric type
          switch (data.metric) {
            case 'LCP':
              metricData.lcp = Math.round(data.value);
              break;
            case 'FID':
              metricData.fid = Math.round(data.value);
              break;
            case 'CLS':
              metricData.cls = Math.round(data.value * 1000); // Store CLS * 1000 as integer
              break;
            case 'TTFB':
              metricData.ttfb = Math.round(data.value);
              break;
            case 'FCP':
              // FCP doesn't have its own field in the schema, but we can add it to TTFB or extend schema
              metricData.ttfb = Math.round(data.value);
              break;
          }

          await db.insert(performanceMetrics).values(metricData);
        } catch (dbError) {
          console.warn('Failed to save performance metric to database:', dbError);
          Sentry.captureException(dbError);
        }
      }

      // Send poor metrics to Sentry as warnings
      if (data.rating === 'poor') {
        Sentry.captureMessage(
          `Poor Web Vital: ${data.metric} = ${data.value}ms on ${data.configId || 'unknown'}`,
          'warning'
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process performance metric:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to process performance metric' },
      { status: 400 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}