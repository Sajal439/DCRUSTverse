export interface DirectoryDepartment {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface DirectoryStaff {
  id: string;
  fullName: string;
  email: string;
  departmentName?: string | null;
  designation?: string | null;
  officeLocation?: string | null;
  officeHours?: string | null;
  phone?: string | null;
  contactVisibility: 'public' | 'campus_only' | 'private';
}

export interface DirectoryRepository {
  searchDepartments(query?: string): Promise<DirectoryDepartment[]>;
  searchStaff(query?: string): Promise<DirectoryStaff[]>;
}
