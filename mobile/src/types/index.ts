export type CampusRole =
  | 'student'
  | 'faculty'
  | 'department_head'
  | 'librarian'
  | 'hostel_warden'
  | 'placement_officer'
  | 'club_coordinator'
  | 'service_staff'
  | 'administrator';

export interface CampusUser {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
  departmentId: string | null;
  status: 'active' | 'pending' | 'disabled';
  createdAt: string;
  roles?: { role: CampusRole; scopeType: string; scopeId: string | null }[];
}

export interface CampusProfile {
  id: string;
  userId: string;
  rollNumber: string | null;
  employeeId: string | null;
  designation: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface CurrentIdentityResponse {
  id: string;
  email: string;
  campus?: CampusUser;
  profile?: CampusProfile;
}

// Academics
export interface TimetableEntry {
  id: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  startTime: string; // HH:mm
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  facultyName: string;
  sectionName: string;
}

export interface AttendanceSubject {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  recentRecords: {
    id: string;
    date: string;
    status: 'present' | 'absent' | 'excused';
  }[];
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  courseCode: string;
  courseName: string;
  dueDate: string;
  maxScore: number;
  status: 'pending' | 'submitted' | 'graded';
  mySubmission?: {
    id: string;
    submittedAt: string;
    content: string;
    score: number | null;
    feedback: string | null;
  };
}

// Campus Services & Complaints (F10)
export interface ComplaintTicket {
  id: string;
  ticketNumber: string;
  category: 'hostel' | 'electrical' | 'it_network' | 'academics' | 'sanitation' | 'library' | 'other';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignedStaffName?: string;
  resolutionNotes?: string;
}

// Notices (F13)
export interface CampusNotice {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'administrative' | 'placement' | 'event' | 'urgent';
  targetRole?: CampusRole;
  isUrgent: boolean;
  publishedAt: string;
  authorName: string;
}

// Digital ID (F32)
export interface DigitalIdPayload {
  credentialId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  validUntil: string;
  signature: string;
  status: 'active' | 'revoked';
  qrPayload: string;
}

// Campus Explorer & Navigation (F14)
export interface CampusBuilding {
  id: string;
  code: string;
  name: string;
  category: 'academic' | 'administrative' | 'hostel' | 'library' | 'sports' | 'amenity';
  description: string;
  coordinates: { latitude: number; longitude: number };
  openingHours: string;
  accessible: boolean;
  facilities: string[];
}

// IoT Bus Tracking (F33)
export interface BusLocation {
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  currentStop: string;
  nextStop: string;
  latitude: number;
  longitude: number;
  speedKmH: number;
  lastUpdated: string;
  isStale: boolean;
  occupancyStatus: 'seats_available' | 'standing_only' | 'full';
}

// AI Assistant (F30)
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { title: string; section?: string }[];
}
