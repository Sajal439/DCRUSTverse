export interface FacultyAvailabilityItem {
  id: string;
  facultyId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AppointmentItem {
  id: string;
  facultyId: string;
  studentId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  reason: string;
  notes?: string | null;
  createdAt: string;
}

export interface AppointmentsRepository {
  setAvailability(data: {
    facultyId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }): Promise<FacultyAvailabilityItem>;

  getFacultyAvailabilities(facultyId: string): Promise<FacultyAvailabilityItem[]>;

  hasOverlappingConfirmedAppointment(
    facultyId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<boolean>;

  requestAppointment(data: {
    facultyId: string;
    studentId: string;
    startTime: Date;
    endTime: Date;
    reason: string;
  }): Promise<AppointmentItem>;

  listAppointments(filters: {
    facultyId?: string;
    studentId?: string;
    status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  }): Promise<AppointmentItem[]>;

  updateAppointmentStatus(
    id: string,
    status: 'confirmed' | 'rejected' | 'cancelled',
    notes?: string,
  ): Promise<AppointmentItem | null>;
}
