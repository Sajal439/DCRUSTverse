export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface ProgramItem {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  type: 'undergraduate' | 'postgraduate' | 'doctorate' | 'diploma';
  totalSemesters: number;
  createdAt: string;
}

export interface AcademicTermItem {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: string;
}

export interface CourseItem {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  credits: number;
  type: 'core' | 'elective' | 'lab';
  description?: string | null;
  createdAt: string;
}

export interface SectionItem {
  id: string;
  courseId: string;
  academicTermId: string;
  name: string;
  capacity: number;
  createdAt: string;
}

export interface EnrollmentItem {
  id: string;
  studentId: string;
  sectionId: string;
  status: 'enrolled' | 'dropped' | 'completed';
  enrolledAt: string;
}

export interface TeachingAssignmentItem {
  id: string;
  facultyId: string;
  sectionId: string;
  role: 'primary' | 'assistant';
  assignedAt: string;
}

export interface AcademicsRepository {
  listDepartments(): Promise<DepartmentItem[]>;
  createDepartment(data: { code: string; name: string }): Promise<DepartmentItem>;
  getDepartmentById(id: string): Promise<DepartmentItem | null>;

  listPrograms(departmentId?: string): Promise<ProgramItem[]>;
  createProgram(data: {
    departmentId: string;
    code: string;
    name: string;
    type: 'undergraduate' | 'postgraduate' | 'doctorate' | 'diploma';
    totalSemesters: number;
  }): Promise<ProgramItem>;

  listTerms(): Promise<AcademicTermItem[]>;
  createTerm(data: {
    code: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status?: 'upcoming' | 'active' | 'completed';
  }): Promise<AcademicTermItem>;

  listCourses(departmentId?: string): Promise<CourseItem[]>;
  createCourse(data: {
    departmentId: string;
    code: string;
    name: string;
    credits: number;
    type?: 'core' | 'elective' | 'lab';
    description?: string;
  }): Promise<CourseItem>;

  listSections(filters?: { courseId?: string; academicTermId?: string }): Promise<SectionItem[]>;
  createSection(data: {
    courseId: string;
    academicTermId: string;
    name: string;
    capacity?: number;
  }): Promise<SectionItem>;
  getSectionById(id: string): Promise<SectionItem | null>;

  enrollStudent(data: { studentId: string; sectionId: string }): Promise<EnrollmentItem>;
  dropStudent(studentId: string, sectionId: string): Promise<boolean>;
  listEnrollments(filters: { sectionId?: string; studentId?: string }): Promise<EnrollmentItem[]>;

  assignFaculty(data: {
    facultyId: string;
    sectionId: string;
    role?: 'primary' | 'assistant';
  }): Promise<TeachingAssignmentItem>;
  removeFaculty(assignmentId: string): Promise<boolean>;
  listTeachingAssignments(filters: { sectionId?: string; facultyId?: string }): Promise<TeachingAssignmentItem[]>;
}
