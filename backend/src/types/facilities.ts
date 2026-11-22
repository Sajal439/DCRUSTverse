export interface FacilityItem {
  id: string;
  code: string;
  name: string;
  type: 'hall' | 'auditorium' | 'lab' | 'ground' | 'conference_room';
  capacity: number;
}

export interface FacilityBookingItem {
  id: string;
  facilityId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface FacilitiesRepository {
  listFacilities(): Promise<FacilityItem[]>;
  createFacility(data: { code: string; name: string; type: FacilityItem['type']; capacity: number }): Promise<FacilityItem>;
  getFacilityById(id: string): Promise<FacilityItem | null>;

  hasBookingConflict(facilityId: string, startTime: Date, endTime: Date, excludeBookingId?: string): Promise<boolean>;

  requestBooking(data: {
    facilityId: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    purpose: string;
  }): Promise<FacilityBookingItem>;

  listBookings(filters?: { facilityId?: string; userId?: string; status?: string }): Promise<FacilityBookingItem[]>;

  updateBookingStatus(
    id: string,
    status: 'approved' | 'rejected' | 'cancelled',
    reviewedBy?: string,
  ): Promise<FacilityBookingItem | null>;
}
