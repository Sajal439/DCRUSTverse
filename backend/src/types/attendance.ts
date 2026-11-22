export interface AttendanceRecordItem {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  recordedBy?: string | null;
  recordedAt: string;
}

export interface AttendanceCorrectionItem {
  id: string;
  attendanceRecordId: string;
  studentId: string;
  requestedStatus: 'present' | 'excused';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
}

export interface AttendanceRepository {
  recordSessionAttendance(
    sessionId: string,
    records: Array<{ studentId: string; status: 'present' | 'absent' | 'late' | 'excused' }>,
    recordedBy: string,
  ): Promise<AttendanceRecordItem[]>;

  hasRecordedAttendance(sessionId: string): Promise<boolean>;

  listSessionAttendance(sessionId: string): Promise<AttendanceRecordItem[]>;

  getStudentAttendanceSummary(studentId: string, sectionId?: string): Promise<StudentAttendanceSummary>;

  requestCorrection(data: {
    attendanceRecordId: string;
    studentId: string;
    requestedStatus: 'present' | 'excused';
    reason: string;
  }): Promise<AttendanceCorrectionItem>;

  listCorrections(filters: { studentId?: string; status?: 'pending' | 'approved' | 'rejected' }): Promise<AttendanceCorrectionItem[]>;

  reviewCorrection(
    correctionId: string,
    action: 'approved' | 'rejected',
    reviewedBy: string,
  ): Promise<AttendanceCorrectionItem | null>;
}
