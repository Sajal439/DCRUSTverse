export interface HostelItem {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'coed';
  wardenId?: string | null;
  capacity: number;
}

export interface HostelRoomItem {
  id: string;
  hostelId: string;
  roomNumber: string;
  capacity: number;
  currentOccupancy: number;
}

export interface HostelApplicationItem {
  id: string;
  studentId: string;
  hostelId: string;
  status: 'pending' | 'approved' | 'allocated' | 'rejected';
  appliedAt: string;
}

export interface HostelAllocationItem {
  id: string;
  studentId: string;
  roomId: string;
  allocatedAt: string;
}

export interface HostelTransferItem {
  id: string;
  studentId: string;
  fromRoomId: string;
  toRoomId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  requestedAt: string;
}

export interface HostelRepository {
  listHostels(): Promise<HostelItem[]>;
  createHostel(data: { name: string; gender: 'male' | 'female' | 'coed'; capacity: number; wardenId?: string }): Promise<HostelItem>;
  listRooms(hostelId: string): Promise<HostelRoomItem[]>;
  createRoom(data: { hostelId: string; roomNumber: string; capacity?: number }): Promise<HostelRoomItem>;
  getRoomById(id: string): Promise<HostelRoomItem | null>;

  apply(studentId: string, hostelId: string): Promise<HostelApplicationItem>;
  listApplications(filters?: { studentId?: string; hostelId?: string; status?: string }): Promise<HostelApplicationItem[]>;

  getAllocationByStudent(studentId: string): Promise<HostelAllocationItem | null>;
  allocateRoom(studentId: string, roomId: string): Promise<HostelAllocationItem>;

  requestTransfer(studentId: string, toRoomId: string, reason: string): Promise<HostelTransferItem>;
  listTransfers(filters?: { studentId?: string; status?: string }): Promise<HostelTransferItem[]>;
  approveTransfer(transferId: string, reviewerId: string): Promise<HostelTransferItem | null>;
}
