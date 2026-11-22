export interface RoomItem {
  id: string;
  code: string;
  name: string;
  building: string;
  capacity: number;
  type: 'lecture_hall' | 'classroom' | 'lab' | 'seminar_hall';
  createdAt: string;
}

export interface ClassSessionItem {
  id: string;
  sectionId: string;
  roomId: string;
  facultyId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date?: string | null;
  status: 'scheduled' | 'cancelled' | 'rescheduled';
  createdAt: string;
}

export interface TimetableRepository {
  listRooms(): Promise<RoomItem[]>;
  createRoom(data: {
    code: string;
    name: string;
    building: string;
    capacity: number;
    type?: 'lecture_hall' | 'classroom' | 'lab' | 'seminar_hall';
  }): Promise<RoomItem>;
  getRoomById(id: string): Promise<RoomItem | null>;

  listSessions(filters?: {
    sectionId?: string;
    roomId?: string;
    facultyId?: string;
    dayOfWeek?: number;
  }): Promise<ClassSessionItem[]>;
  createSession(data: {
    sectionId: string;
    roomId: string;
    facultyId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    date?: string | null;
  }): Promise<ClassSessionItem>;
  updateSessionStatus(id: string, status: 'scheduled' | 'cancelled' | 'rescheduled'): Promise<ClassSessionItem | null>;
  checkRoomConflict(roomId: string, dayOfWeek: number, startTime: string, endTime: string, excludeSessionId?: string): Promise<boolean>;
  checkFacultyConflict(facultyId: string, dayOfWeek: number, startTime: string, endTime: string, excludeSessionId?: string): Promise<boolean>;
}
