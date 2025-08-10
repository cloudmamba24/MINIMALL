"use client";

import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  EmptyState,
  Modal,
  Popover,
  Select,
  Spinner,
  Text,
  Tooltip,
} from "@shopify/polaris";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EditIcon,
  DeleteIcon,
  PlayIcon,
} from "@shopify/polaris-icons";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  type ScheduledPublish,
  formatScheduledDate,
  getCommonTimezones,
} from "../../lib/scheduling-utils";

interface ContentCalendarProps {
  schedules: ScheduledPublish[];
  onEditSchedule: (schedule: ScheduledPublish) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onPublishNow: (scheduleId: string) => void;
  loading?: boolean;
  timezone?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  schedules: ScheduledPublish[];
}

export function ContentCalendar({
  schedules,
  onEditSchedule,
  onDeleteSchedule,
  onPublishNow,
  loading = false,
  timezone = "UTC",
}: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledPublish | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);

  const timezoneOptions = getCommonTimezones();

  // Generate calendar days for current view
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === "month") {
      // Get first day of month and adjust to start of week
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      // Generate 42 days (6 weeks) for month view
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const daySchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.scheduledAt);
          return (
            scheduleDate.getDate() === date.getDate() &&
            scheduleDate.getMonth() === date.getMonth() &&
            scheduleDate.getFullYear() === date.getFullYear()
          );
        });
        
        days.push({
          date,
          isCurrentMonth: date.getMonth() === month,
          schedules: daySchedules,
        });
      }
    } else {
      // Week view - get current week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const daySchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.scheduledAt);
          return (
            scheduleDate.getDate() === date.getDate() &&
            scheduleDate.getMonth() === date.getMonth() &&
            scheduleDate.getFullYear() === date.getFullYear()
          );
        });
        
        days.push({
          date,
          isCurrentMonth: true,
          schedules: daySchedules,
        });
      }
    }
    
    return days;
  }, [currentDate, viewMode, schedules]);

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === "month") {
        newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      } else {
        newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      }
      return newDate;
    });
  }, [viewMode]);

  const getStatusColor = useCallback((status: ScheduledPublish["status"]) => {
    switch (status) {
      case "pending":
        return "info";
      case "published":
        return "success";
      case "failed":
        return "critical";
      case "cancelled":
        return "subdued";
      default:
        return "subdued";
    }
  }, []);

  const handleDeleteClick = useCallback((schedule: ScheduledPublish) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedSchedule) {
      await onDeleteSchedule(selectedSchedule.id);
      setShowDeleteModal(false);
      setSelectedSchedule(null);
    }
  }, [selectedSchedule, onDeleteSchedule]);

  const formatCalendarHeader = useCallback(() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(currentDate);
  }, [currentDate]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Spinner size="large" />
          <Text variant="bodyLg" as="p">
            Loading calendar...
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <ButtonGroup>
                <Button
                  icon={ChevronLeftIcon}
                  onClick={() => navigateMonth("prev")}
                  accessibilityLabel="Previous month"
                />
                <Button
                  icon={ChevronRightIcon}
                  onClick={() => navigateMonth("next")}
                  accessibilityLabel="Next month"
                />
              </ButtonGroup>
              
              <Text variant="headingLg" as="h2">
                {formatCalendarHeader()}
              </Text>
            </div>
            
            <div className="flex items-center gap-4">
              <Select
                label=""
                options={[
                  { label: "Month", value: "month" },
                  { label: "Week", value: "week" },
                ]}
                value={viewMode}
                onChange={(value) => setViewMode(value as typeof viewMode)}
              />
              
              <Select
                label=""
                options={timezoneOptions}
                value={selectedTimezone}
                onChange={setSelectedTimezone}
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center">
                <Text variant="bodyMd" tone="subdued" as="span">
                  {day}
                </Text>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <CalendarDayCell
                key={index}
                day={day}
                viewMode={viewMode}
                timezone={selectedTimezone}
                onEditSchedule={onEditSchedule}
                onDeleteSchedule={handleDeleteClick}
                onPublishNow={onPublishNow}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>

          {/* Empty State */}
          {schedules.length === 0 && (
            <div className="mt-8">
              <EmptyState
                heading="No scheduled content"
                action={{ content: "Schedule your first publish", onAction: () => {} }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Schedule your content to be published automatically at specific times.</p>
              </EmptyState>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Scheduled Publish"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete this scheduled publish? This action cannot be undone.
          </Text>
          {selectedSchedule && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <Text variant="bodyMd" as="p">
                <strong>{selectedSchedule.metadata?.title || "Untitled"}</strong>
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Scheduled for: {formatScheduledDate(selectedSchedule.scheduledAt, selectedTimezone)}
              </Text>
            </div>
          )}
        </Modal.Section>
      </Modal>
    </>
  );
}

interface CalendarDayCellProps {
  day: CalendarDay;
  viewMode: "month" | "week";
  timezone: string;
  onEditSchedule: (schedule: ScheduledPublish) => void;
  onDeleteSchedule: (schedule: ScheduledPublish) => void;
  onPublishNow: (scheduleId: string) => void;
  getStatusColor: (status: ScheduledPublish["status"]) => string;
}

function CalendarDayCell({
  day,
  viewMode,
  timezone,
  onEditSchedule,
  onDeleteSchedule,
  onPublishNow,
  getStatusColor,
}: CalendarDayCellProps) {
  const [popoverActive, setPopoverActive] = useState(false);
  const isToday = day.date.toDateString() === new Date().toDateString();
  
  const cellHeight = viewMode === "week" ? "h-32" : "h-24";
  
  const activator = (
    <button
      className={`w-full ${cellHeight} p-1 border border-gray-200 hover:bg-gray-50 text-left relative ${
        !day.isCurrentMonth ? "opacity-40" : ""
      } ${isToday ? "bg-blue-50 border-blue-300" : ""}`}
      onClick={() => day.schedules.length > 0 && setPopoverActive(true)}
    >
      <div className="flex justify-between items-start mb-1">
        <Text variant="bodySm" as="span" tone={day.isCurrentMonth ? "base" : "subdued"}>
          {day.date.getDate()}
        </Text>
        {day.schedules.length > 0 && (
          <Badge tone="info" size="small">
            {day.schedules.length}
          </Badge>
        )}
      </div>
      
      {/* Show up to 2 schedules in the cell */}
      <div className="space-y-1">
        {day.schedules.slice(0, 2).map((schedule) => (
          <div
            key={schedule.id}
            className="text-xs p-1 rounded truncate"
            style={{
              backgroundColor: getScheduleBadgeColor(getStatusColor(schedule.status)),
            }}
          >
            {schedule.metadata?.title || "Untitled"}
          </div>
        ))}
        
        {day.schedules.length > 2 && (
          <div className="text-xs text-gray-500">
            +{day.schedules.length - 2} more
          </div>
        )}
      </div>
    </button>
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={() => setPopoverActive(false)}
      sectioned
    >
      <div className="min-w-64">
        <Text variant="headingMd" as="h3">
          {day.date.toLocaleDateString()}
        </Text>
        
        <div className="mt-4 space-y-3">
          {day.schedules.map((schedule) => (
            <SchedulePopoverItem
              key={schedule.id}
              schedule={schedule}
              timezone={timezone}
              onEdit={() => {
                onEditSchedule(schedule);
                setPopoverActive(false);
              }}
              onDelete={() => {
                onDeleteSchedule(schedule);
                setPopoverActive(false);
              }}
              onPublishNow={() => {
                onPublishNow(schedule.id);
                setPopoverActive(false);
              }}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      </div>
    </Popover>
  );
}

interface SchedulePopoverItemProps {
  schedule: ScheduledPublish;
  timezone: string;
  onEdit: () => void;
  onDelete: () => void;
  onPublishNow: () => void;
  getStatusColor: (status: ScheduledPublish["status"]) => string;
}

function SchedulePopoverItem({
  schedule,
  timezone,
  onEdit,
  onDelete,
  onPublishNow,
  getStatusColor,
}: SchedulePopoverItemProps) {
  const canPublishNow = schedule.status === "pending";
  const canEdit = schedule.status === "pending";
  
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <Text variant="bodyMd" as="h4">
            {schedule.metadata?.title || "Untitled"}
          </Text>
          <div className="flex items-center gap-2 mt-1">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <Text variant="bodySm" tone="subdued">
              {formatScheduledDate(schedule.scheduledAt, timezone)}
            </Text>
          </div>
        </div>
        <Badge tone={getStatusColor(schedule.status) as any}>
          {schedule.status}
        </Badge>
      </div>
      
      {schedule.metadata?.description && (
        <Text variant="bodySm" tone="subdued" as="p">
          {schedule.metadata.description}
        </Text>
      )}
      
      <div className="flex gap-2 mt-3">
        {canEdit && (
          <Tooltip content="Edit schedule">
            <Button size="slim" icon={EditIcon} onClick={onEdit} />
          </Tooltip>
        )}
        
        {canPublishNow && (
          <Tooltip content="Publish now">
            <Button size="slim" icon={PlayIcon} onClick={onPublishNow} />
          </Tooltip>
        )}
        
        <Tooltip content="Delete schedule">
          <Button 
            size="slim" 
            icon={DeleteIcon} 
            tone="critical" 
            onClick={onDelete}
          />
        </Tooltip>
      </div>
    </div>
  );
}

function getScheduleBadgeColor(tone: string): string {
  switch (tone) {
    case "info":
      return "#e0f2fe";
    case "success":
      return "#e8f5e8";
    case "critical":
      return "#ffebee";
    case "subdued":
      return "#f5f5f5";
    default:
      return "#f0f0f0";
  }
}