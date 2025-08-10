"use client";

import {
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  DatePicker,
  FormLayout,
  InlineStack,
  Modal,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { CalendarIcon, ClockIcon } from "@shopify/polaris-icons";
import React, { useState, useCallback, useEffect } from "react";
import {
  type ScheduledPublish,
  type RecurringSchedule,
  scheduleSchema,
  validateScheduleTiming,
  formatScheduledDate,
  getCommonTimezones,
  suggestOptimalScheduleTime,
} from "../../lib/scheduling-utils";

interface ScheduleManagerProps {
  open: boolean;
  onClose: () => void;
  configId: string;
  versionId: string;
  onSchedule: (schedule: Partial<ScheduledPublish>) => Promise<void>;
  existingSchedule?: ScheduledPublish;
}

export function ScheduleManager({
  open,
  onClose,
  configId,
  versionId,
  onSchedule,
  existingSchedule,
}: ScheduleManagerProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timezone, setTimezone] = useState("UTC");

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeValue, setTimeValue] = useState("10:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Recurring schedule state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [interval, setInterval] = useState("1");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const timezoneOptions = getCommonTimezones();

  // Initialize form with existing schedule or defaults
  useEffect(() => {
    if (existingSchedule) {
      const scheduledDate = new Date(existingSchedule.scheduledAt);
      setSelectedDate(scheduledDate);
      setTimeValue(
        scheduledDate.toTimeString().slice(0, 5) // HH:MM format
      );
      setTimezone(existingSchedule.timezone);
      setTitle(existingSchedule.metadata?.title || "");
      setDescription(existingSchedule.metadata?.description || "");
      
      if (existingSchedule.metadata?.recurring) {
        setIsRecurring(true);
        const recurring = existingSchedule.metadata.recurring;
        setRecurringType(recurring.type);
        setInterval(recurring.interval.toString());
        setEndDate(recurring.endDate);
        setSelectedDays(recurring.daysOfWeek || []);
        setDayOfMonth(recurring.dayOfMonth?.toString() || "1");
      }
    } else {
      // Set optimal default time
      const optimal = suggestOptimalScheduleTime(timezone);
      setSelectedDate(optimal);
      setTimeValue("10:00");
    }
  }, [existingSchedule, timezone]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Combine date and time
    const [hours, minutes] = timeValue.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);
    
    // Validate timing
    const timingValidation = validateScheduleTiming(scheduledAt);
    if (!timingValidation.valid) {
      newErrors.timing = timingValidation.error || "Invalid schedule time";
    }
    
    // Validate recurring settings
    if (isRecurring) {
      if (recurringType === "weekly" && selectedDays.length === 0) {
        newErrors.recurring = "Please select at least one day of the week";
      }
      
      if (recurringType === "monthly") {
        const day = parseInt(dayOfMonth);
        if (day < 1 || day > 31) {
          newErrors.recurring = "Day of month must be between 1 and 31";
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedDate, timeValue, isRecurring, recurringType, selectedDays, dayOfMonth]);

  const handleSchedule = useCallback(async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Combine date and time
      const [hours, minutes] = timeValue.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      // Build recurring schedule if enabled
      let recurring: RecurringSchedule | undefined;
      if (isRecurring) {
        recurring = {
          type: recurringType,
          interval: parseInt(interval),
          endDate,
          ...(recurringType === "weekly" && { daysOfWeek: selectedDays }),
          ...(recurringType === "monthly" && { dayOfMonth: parseInt(dayOfMonth) }),
        };
      }
      
      const scheduleData: Partial<ScheduledPublish> = {
        configId,
        versionId,
        scheduledAt,
        timezone,
        metadata: {
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          recurring,
        },
      };
      
      // Validate with schema
      const validation = scheduleSchema.safeParse(scheduleData);
      if (!validation.success) {
        setErrors({ schema: validation.error.errors[0]?.message || "Validation failed" });
        return;
      }
      
      await onSchedule(scheduleData);
      onClose();
    } catch (error) {
      setErrors({ 
        submit: error instanceof Error ? error.message : "Failed to schedule publish" 
      });
    } finally {
      setLoading(false);
    }
  }, [
    validateForm, selectedDate, timeValue, isRecurring, recurringType, 
    interval, endDate, selectedDays, dayOfMonth, configId, versionId,
    timezone, title, description, onSchedule, onClose
  ]);

  const handleDayToggle = useCallback((day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  }, []);

  const previewScheduledTime = useCallback(() => {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);
    return formatScheduledDate(scheduledAt, timezone);
  }, [selectedDate, timeValue, timezone]);

  const weekDays = [
    { label: "Sun", value: 0 },
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existingSchedule ? "Edit Scheduled Publish" : "Schedule Publish"}
      primaryAction={{
        content: existingSchedule ? "Update Schedule" : "Schedule Publish",
        onAction: handleSchedule,
        loading,
        disabled: Object.keys(errors).length > 0,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
      size="large"
    >
      <Modal.Section>
        <FormLayout>
          {/* Basic Information */}
          <Card>
            <div className="p-4 space-y-4">
              <Text variant="headingMd" as="h3">
                Schedule Details
              </Text>
              
              <FormLayout.Group>
                <TextField
                  label="Title (Optional)"
                  value={title}
                  onChange={setTitle}
                  placeholder="Marketing Campaign Launch"
                  autoComplete="off"
                />
                
                <Select
                  label="Timezone"
                  options={timezoneOptions}
                  value={timezone}
                  onChange={setTimezone}
                />
              </FormLayout.Group>
              
              <TextField
                label="Description (Optional)"
                value={description}
                onChange={setDescription}
                placeholder="Brief description of what's being published..."
                multiline={2}
                autoComplete="off"
              />
            </div>
          </Card>

          {/* Date and Time Selection */}
          <Card>
            <div className="p-4 space-y-4">
              <Text variant="headingMd" as="h3">
                Date & Time
              </Text>
              
              <FormLayout.Group>
                <div>
                  <Text variant="bodyMd" as="label">
                    Date
                  </Text>
                  <div className="mt-2">
                    <DatePicker
                      month={selectedDate.getMonth()}
                      year={selectedDate.getFullYear()}
                      selected={selectedDate}
                      onMonthChange={(month, year) => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(month);
                        newDate.setFullYear(year);
                        setSelectedDate(newDate);
                      }}
                      onChange={setSelectedDate}
                    />
                  </div>
                </div>
                
                <TextField
                  label="Time"
                  type="time"
                  value={timeValue}
                  onChange={setTimeValue}
                  prefix={<ClockIcon />}
                />
              </FormLayout.Group>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <Text variant="bodySm" tone="subdued">
                  <strong>Scheduled for:</strong> {previewScheduledTime()}
                </Text>
              </div>
              
              {errors.timing && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Text variant="bodySm" tone="critical">
                    {errors.timing}
                  </Text>
                </div>
              )}
            </div>
          </Card>

          {/* Recurring Schedule */}
          <Card>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Text variant="headingMd" as="h3">
                  Recurring Schedule
                </Text>
                <Checkbox
                  label="Enable recurring"
                  checked={isRecurring}
                  onChange={setIsRecurring}
                />
              </div>
              
              {isRecurring && (
                <div className="space-y-4">
                  <FormLayout.Group>
                    <Select
                      label="Repeat"
                      options={[
                        { label: "Daily", value: "daily" },
                        { label: "Weekly", value: "weekly" },
                        { label: "Monthly", value: "monthly" },
                      ]}
                      value={recurringType}
                      onChange={(value) => setRecurringType(value as typeof recurringType)}
                    />
                    
                    <TextField
                      label="Every"
                      type="number"
                      value={interval}
                      onChange={setInterval}
                      min="1"
                      max="365"
                      suffix={recurringType === "daily" ? "days" : 
                             recurringType === "weekly" ? "weeks" : "months"}
                      autoComplete="off"
                    />
                  </FormLayout.Group>
                  
                  {recurringType === "weekly" && (
                    <div>
                      <Text variant="bodyMd" as="label">
                        Days of week
                      </Text>
                      <div className="mt-2 flex gap-2">
                        {weekDays.map((day) => (
                          <Button
                            key={day.value}
                            size="slim"
                            pressed={selectedDays.includes(day.value)}
                            onClick={() => handleDayToggle(day.value)}
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {recurringType === "monthly" && (
                    <TextField
                      label="Day of month"
                      type="number"
                      value={dayOfMonth}
                      onChange={setDayOfMonth}
                      min="1"
                      max="31"
                      helpText="For months with fewer days, will use the last day"
                      autoComplete="off"
                    />
                  )}
                  
                  <div>
                    <Text variant="bodyMd" as="label">
                      End date (optional)
                    </Text>
                    <div className="mt-2">
                      <DatePicker
                        month={endDate?.getMonth() || new Date().getMonth()}
                        year={endDate?.getFullYear() || new Date().getFullYear()}
                        selected={endDate}
                        onMonthChange={(month, year) => {
                          const newDate = endDate || new Date();
                          newDate.setMonth(month);
                          newDate.setFullYear(year);
                          setEndDate(newDate);
                        }}
                        onChange={setEndDate}
                      />
                    </div>
                  </div>
                  
                  {errors.recurring && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Text variant="bodySm" tone="critical">
                        {errors.recurring}
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Error Messages */}
          {(errors.schema || errors.submit) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text variant="bodySm" tone="critical">
                {errors.schema || errors.submit}
              </Text>
            </div>
          )}
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}