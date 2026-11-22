export interface CalendarEntry {
  id: string;
  type: 'class' | 'assignment_due' | 'appointment';
  title: string;
  startTime: string;
  endTime?: string;
  sourceId: string;
}
