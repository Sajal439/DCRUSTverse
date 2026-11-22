export interface ClubItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  coordinatorId?: string | null;
  createdAt: string;
}

export interface EventItem {
  id: string;
  clubId?: string | null;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: 'pending' | 'approved' | 'cancelled';
  createdBy: string;
  createdAt: string;
}

export interface EventRegistrationItem {
  id: string;
  eventId: string;
  studentId: string;
  attended: boolean;
  registeredAt: string;
}

export interface ClubsRepository {
  listClubs(): Promise<ClubItem[]>;
  createClub(data: { code: string; name: string; description?: string; coordinatorId?: string }): Promise<ClubItem>;
  joinClub(clubId: string, studentId: string): Promise<{ id: string; clubId: string; studentId: string; status: string }>;

  listEvents(filters?: { clubId?: string; status?: string }): Promise<EventItem[]>;
  createEvent(data: {
    clubId?: string;
    title: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
    capacity: number;
    createdBy: string;
  }): Promise<EventItem>;
  approveEvent(id: string): Promise<EventItem | null>;

  registerForEvent(eventId: string, studentId: string): Promise<EventRegistrationItem>;
  getRegistrationCount(eventId: string): Promise<number>;
  listRegistrations(eventId: string): Promise<EventRegistrationItem[]>;
}
