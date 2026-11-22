export interface AssignmentItem {
  id: string;
  sectionId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxMarks: number;
  allowLate: boolean;
  createdAt: string;
}

export interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string | null;
  fileUrl?: string | null;
  submittedAt: string;
  isLate: boolean;
  grade?: GradeItem | null;
}

export interface GradeItem {
  id: string;
  submissionId: string;
  marksObtained: number;
  feedback?: string | null;
  gradedBy: string;
  gradedAt: string;
}

export interface ResultPublicationItem {
  id: string;
  sectionId: string;
  publishedBy: string;
  publishedAt: string;
}

export interface AssignmentsRepository {
  createAssignment(data: {
    sectionId: string;
    createdBy: string;
    title: string;
    description?: string;
    dueDate: Date;
    maxMarks?: number;
    allowLate?: boolean;
  }): Promise<AssignmentItem>;

  getAssignmentById(id: string): Promise<AssignmentItem | null>;

  listAssignments(sectionId: string): Promise<AssignmentItem[]>;

  submitAssignment(data: {
    assignmentId: string;
    studentId: string;
    content?: string;
    fileUrl?: string;
    isLate: boolean;
  }): Promise<SubmissionItem>;

  getSubmission(assignmentId: string, studentId: string): Promise<SubmissionItem | null>;

  listSubmissions(assignmentId: string): Promise<SubmissionItem[]>;

  gradeSubmission(data: {
    submissionId: string;
    marksObtained: number;
    feedback?: string;
    gradedBy: string;
  }): Promise<GradeItem>;

  publishResults(sectionId: string, publishedBy: string): Promise<boolean>;

  isResultsPublished(sectionId: string): Promise<boolean>;

  getStudentResults(studentId: string, sectionId: string): Promise<{
    isPublished: boolean;
    results: Array<{
      assignmentTitle: string;
      maxMarks: number;
      marksObtained: number | null;
      feedback: string | null;
    }>;
  }>;
}
