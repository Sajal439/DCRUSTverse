export type CampusCategory = 'academic' | 'hostel' | 'admin' | 'library' | 'sports' | 'canteen' | 'facility';

export interface LocationRecord {
  id: string;
  code: string;
  name: string;
  category: CampusCategory;
  building: string;
  description?: string | null;
  coordinates: Record<string, any>;
  openingHours?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  entrances?: EntranceRecord[];
  createdAt: string;
}

export interface EntranceRecord {
  id: string;
  locationId: string;
  name: string;
  isAccessible: boolean;
  createdAt: string;
}

export interface PathSegmentRecord {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  distanceMeters: number;
  isAccessible: boolean;
  createdAt: string;
}

export interface RouteResult {
  found: boolean;
  totalDistanceMeters: number;
  isAccessible: boolean;
  path: string[];
  missingRouteData?: boolean;
}

export interface QrLinkRecord {
  id: string;
  locationId: string;
  qrToken: string;
  scanCount: number;
  createdAt: string;
}

export interface CampusRepository {
  listLocations(filters?: { category?: CampusCategory }): Promise<LocationRecord[]>;
  getLocationById(id: string): Promise<LocationRecord | null>;
  createLocation(data: {
    code: string;
    name: string;
    category: CampusCategory;
    building: string;
    description?: string;
    coordinates?: Record<string, any>;
    openingHours?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<LocationRecord>;
  addEntrance(data: { locationId: string; name: string; isAccessible: boolean }): Promise<EntranceRecord>;
  addPathSegment(data: { fromLocationId: string; toLocationId: string; distanceMeters: number; isAccessible: boolean }): Promise<PathSegmentRecord>;
  findRoute(fromLocationId: string, toLocationId: string, accessibleOnly: boolean): Promise<RouteResult>;
  createQrLink(locationId: string): Promise<QrLinkRecord>;
  resolveQrScan(qrToken: string): Promise<{ qr: QrLinkRecord; location: LocationRecord | null } | null>;
}
