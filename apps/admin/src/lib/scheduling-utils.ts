/**
 * Scheduling Utilities
 * 
 * Core utilities for handling scheduled content publishing with timezone support,
 * validation, and conflict resolution for the MINIMALL platform.
 */

import { z } from "zod";

export interface ScheduledPublish {
  id: string;
  configId: string;
  versionId: string;
  scheduledAt: Date;
  timezone: string;
  status: "pending" | "published" | "failed" | "cancelled";
  createdAt: Date;
  publishedAt?: Date;
  error?: string;
  metadata?: {
    title?: string;
    description?: string;
    campaignId?: string;
    recurring?: RecurringSchedule;
  };
}

export interface RecurringSchedule {
  type: "daily" | "weekly" | "monthly";
  interval: number; // Every N days/weeks/months
  endDate?: Date;
  daysOfWeek?: number[]; // For weekly: 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number; // For monthly
}

export interface CampaignSchedule {
  id: string;
  name: string;
  description?: string;
  schedules: ScheduledPublish[];
  createdAt: Date;
  status: "draft" | "active" | "completed" | "cancelled";
}

// Validation schemas
export const scheduleSchema = z.object({
  configId: z.string().min(1, "Config ID is required"),
  versionId: z.string().min(1, "Version ID is required"),
  scheduledAt: z.coerce.date().refine(
    (date) => date > new Date(),
    "Scheduled time must be in the future"
  ),
  timezone: z.string().min(1, "Timezone is required"),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    campaignId: z.string().optional(),
    recurring: z.object({
      type: z.enum(["daily", "weekly", "monthly"]),
      interval: z.number().min(1).max(365),
      endDate: z.coerce.date().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
    }).optional(),
  }).optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  schedules: z.array(scheduleSchema),
});

/**
 * Convert scheduled time from admin timezone to UTC
 */
export function convertToUTC(scheduledAt: Date, timezone: string): Date {
  try {
    // Create a date in the specified timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    
    const formatter = new Intl.DateTimeFormat('sv-SE', options);
    const formattedDate = formatter.format(scheduledAt);
    
    // Parse back and convert to UTC
    const localDate = new Date(formattedDate);
    const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
    
    return utcDate;
  } catch (error) {
    console.error('Timezone conversion error:', error);
    return scheduledAt; // Fallback to original date
  }
}

/**
 * Format date for display in admin interface
 */
export function formatScheduledDate(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return date.toLocaleString();
  }
}

/**
 * Check if a scheduled time conflicts with existing schedules for the same config
 */
export function hasScheduleConflict(
  newSchedule: { configId: string; scheduledAt: Date },
  existingSchedules: ScheduledPublish[],
  bufferMinutes = 5
): boolean {
  const newTime = newSchedule.scheduledAt.getTime();
  const buffer = bufferMinutes * 60 * 1000;
  
  return existingSchedules.some(schedule => {
    if (schedule.configId !== newSchedule.configId || schedule.status === 'cancelled') {
      return false;
    }
    
    const existingTime = schedule.scheduledAt.getTime();
    return Math.abs(newTime - existingTime) < buffer;
  });
}

/**
 * Generate recurring schedule dates
 */
export function generateRecurringDates(
  baseDate: Date,
  recurring: RecurringSchedule,
  maxDates = 100
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(baseDate);
  let count = 0;
  
  while (count < maxDates) {
    // Check if we've reached the end date
    if (recurring.endDate && currentDate > recurring.endDate) {
      break;
    }
    
    dates.push(new Date(currentDate));
    count++;
    
    // Calculate next date based on recurring type
    switch (recurring.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + recurring.interval);
        break;
        
      case 'weekly':
        if (recurring.daysOfWeek?.length) {
          // Find next occurrence of specified days
          const nextDay = findNextWeeklyOccurrence(currentDate, recurring.daysOfWeek, recurring.interval);
          currentDate = nextDay;
        } else {
          currentDate.setDate(currentDate.getDate() + (7 * recurring.interval));
        }
        break;
        
      case 'monthly':
        if (recurring.dayOfMonth) {
          currentDate.setMonth(currentDate.getMonth() + recurring.interval);
          currentDate.setDate(recurring.dayOfMonth);
          
          // Handle months with fewer days
          if (currentDate.getDate() !== recurring.dayOfMonth) {
            currentDate.setDate(0); // Go to last day of previous month
          }
        } else {
          currentDate.setMonth(currentDate.getMonth() + recurring.interval);
        }
        break;
        
      default:
        // Fallback to daily
        currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return dates.slice(1); // Remove the first date (base date)
}

function findNextWeeklyOccurrence(startDate: Date, daysOfWeek: number[], intervalWeeks: number): Date {
  const currentDay = startDate.getDay();
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  
  // Find next day in the current week
  const nextDayThisWeek = sortedDays.find(day => day > currentDay);
  
  if (nextDayThisWeek !== undefined) {
    const nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + (nextDayThisWeek - currentDay));
    return nextDate;
  }
  
  // No more days this week, go to next interval
  const firstDayNextInterval = sortedDays[0];
  if (firstDayNextInterval === undefined) {
    throw new Error("No valid days configured for weekly schedule");
  }
  const nextDate = new Date(startDate);
  const daysToAdd = (7 * intervalWeeks) - currentDay + firstDayNextInterval;
  nextDate.setDate(startDate.getDate() + daysToAdd);
  
  return nextDate;
}

/**
 * Validate schedule timing constraints
 */
export function validateScheduleTiming(scheduledAt: Date): { valid: boolean; error?: string } {
  const now = new Date();
  const timeDiff = scheduledAt.getTime() - now.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  
  // Must be at least 5 minutes in the future
  if (minutesDiff < 5) {
    return { valid: false, error: "Schedule must be at least 5 minutes in the future" };
  }
  
  // Don't allow scheduling more than 1 year ahead
  const maxDays = 365;
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  if (daysDiff > maxDays) {
    return { valid: false, error: `Cannot schedule more than ${maxDays} days in advance` };
  }
  
  return { valid: true };
}

/**
 * Get timezone list for scheduling UI
 */
export function getCommonTimezones(): { label: string; value: string }[] {
  return [
    { label: "UTC", value: "UTC" },
    { label: "Pacific Time (US)", value: "America/Los_Angeles" },
    { label: "Mountain Time (US)", value: "America/Denver" },
    { label: "Central Time (US)", value: "America/Chicago" },
    { label: "Eastern Time (US)", value: "America/New_York" },
    { label: "British Time", value: "Europe/London" },
    { label: "Central European Time", value: "Europe/Berlin" },
    { label: "Eastern European Time", value: "Europe/Helsinki" },
    { label: "Moscow Time", value: "Europe/Moscow" },
    { label: "India Standard Time", value: "Asia/Kolkata" },
    { label: "China Standard Time", value: "Asia/Shanghai" },
    { label: "Japan Standard Time", value: "Asia/Tokyo" },
    { label: "Australian Eastern Time", value: "Australia/Sydney" },
  ];
}

/**
 * Calculate optimal scheduling time to avoid peak traffic
 */
export function suggestOptimalScheduleTime(timezone: string): Date {
  const now = new Date();
  const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  
  // Suggest 10 AM local time tomorrow as a good default
  const tomorrow = new Date(localTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  // Convert back to user's actual timezone for scheduling
  return convertToUTC(tomorrow, timezone);
}

/**
 * Batch schedule validation for campaigns
 */
export function validateCampaignSchedules(
  schedules: Partial<ScheduledPublish>[],
  existingSchedules: ScheduledPublish[] = []
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allSchedules = [...existingSchedules];
  
  for (let i = 0; i < schedules.length; i++) {
    const schedule = schedules[i];
    
    if (!schedule) {
      errors.push(`Schedule ${i + 1}: Schedule is undefined`);
      continue;
    }
    
    if (!schedule.scheduledAt || !schedule.configId) {
      errors.push(`Schedule ${i + 1}: Missing required fields`);
      continue;
    }
    
    // Validate timing
    const timingValidation = validateScheduleTiming(schedule.scheduledAt);
    if (!timingValidation.valid) {
      errors.push(`Schedule ${i + 1}: ${timingValidation.error}`);
    }
    
    // Check for conflicts
    if (hasScheduleConflict(schedule as any, allSchedules)) {
      errors.push(`Schedule ${i + 1}: Conflicts with existing schedule`);
    }
    
    // Add to temporary list for next iteration conflict checking
    allSchedules.push(schedule as ScheduledPublish);
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get schedules that are ready to publish (within 1 minute of scheduled time)
 */
export function getSchedulesReadyToPublish(schedules: ScheduledPublish[]): ScheduledPublish[] {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
  
  return schedules.filter(schedule => 
    schedule.status === 'pending' &&
    schedule.scheduledAt >= oneMinuteAgo &&
    schedule.scheduledAt <= oneMinuteFromNow
  );
}