import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import {
  assignments,
  submissions,
  grades,
  resultPublications,
} from '../../../database/schema.ts';

import type {
  AssignmentItem,
  SubmissionItem,
  GradeItem,
  AssignmentsRepository,
} from '../../../types/assignments.ts';

export type {
  AssignmentItem,
  SubmissionItem,
  GradeItem,
  AssignmentsRepository,
};

export function createDrizzleAssignmentsRepository(db: NodePgDatabase<typeof schema>): AssignmentsRepository {
  return {
    async createAssignment(data): Promise<AssignmentItem> {
      const [row] = await db
        .insert(assignments)
        .values({
          sectionId: data.sectionId,
          createdBy: data.createdBy,
          title: data.title.trim(),
          description: data.description ?? null,
          dueDate: data.dueDate,
          maxMarks: data.maxMarks ?? 100,
          allowLate: data.allowLate ?? true,
        })
        .returning();
      if (!row) throw new Error('Failed to create assignment');
      return {
        id: row.id,
        sectionId: row.sectionId,
        createdBy: row.createdBy,
        title: row.title,
        description: row.description,
        dueDate: row.dueDate.toISOString(),
        maxMarks: row.maxMarks,
        allowLate: row.allowLate,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async getAssignmentById(id): Promise<AssignmentItem | null> {
      const [row] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        sectionId: row.sectionId,
        createdBy: row.createdBy,
        title: row.title,
        description: row.description,
        dueDate: row.dueDate.toISOString(),
        maxMarks: row.maxMarks,
        allowLate: row.allowLate,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listAssignments(sectionId): Promise<AssignmentItem[]> {
      const rows = await db.select().from(assignments).where(eq(assignments.sectionId, sectionId)).orderBy(assignments.dueDate);
      return rows.map(r => ({
        id: r.id,
        sectionId: r.sectionId,
        createdBy: r.createdBy,
        title: r.title,
        description: r.description,
        dueDate: r.dueDate.toISOString(),
        maxMarks: r.maxMarks,
        allowLate: r.allowLate,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async submitAssignment(data): Promise<SubmissionItem> {
      const [row] = await db
        .insert(submissions)
        .values({
          assignmentId: data.assignmentId,
          studentId: data.studentId,
          content: data.content ?? null,
          fileUrl: data.fileUrl ?? null,
          isLate: data.isLate,
        })
        .returning();
      if (!row) throw new Error('Failed to submit assignment');
      return {
        id: row.id,
        assignmentId: row.assignmentId,
        studentId: row.studentId,
        content: row.content,
        fileUrl: row.fileUrl,
        submittedAt: row.submittedAt.toISOString(),
        isLate: row.isLate,
        grade: null,
      };
    },

    async getSubmission(assignmentId, studentId): Promise<SubmissionItem | null> {
      const [row] = await db
        .select()
        .from(submissions)
        .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId)))
        .limit(1);
      if (!row) return null;

      const [gradeRow] = await db.select().from(grades).where(eq(grades.submissionId, row.id)).limit(1);

      return {
        id: row.id,
        assignmentId: row.assignmentId,
        studentId: row.studentId,
        content: row.content,
        fileUrl: row.fileUrl,
        submittedAt: row.submittedAt.toISOString(),
        isLate: row.isLate,
        grade: gradeRow ? {
          id: gradeRow.id,
          submissionId: gradeRow.submissionId,
          marksObtained: gradeRow.marksObtained,
          feedback: gradeRow.feedback,
          gradedBy: gradeRow.gradedBy,
          gradedAt: gradeRow.gradedAt.toISOString(),
        } : null,
      };
    },

    async listSubmissions(assignmentId): Promise<SubmissionItem[]> {
      const rows = await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
      return Promise.all(
        rows.map(async r => {
          const [gradeRow] = await db.select().from(grades).where(eq(grades.submissionId, r.id)).limit(1);
          return {
            id: r.id,
            assignmentId: r.assignmentId,
            studentId: r.studentId,
            content: r.content,
            fileUrl: r.fileUrl,
            submittedAt: r.submittedAt.toISOString(),
            isLate: r.isLate,
            grade: gradeRow ? {
              id: gradeRow.id,
              submissionId: gradeRow.submissionId,
              marksObtained: gradeRow.marksObtained,
              feedback: gradeRow.feedback,
              gradedBy: gradeRow.gradedBy,
              gradedAt: gradeRow.gradedAt.toISOString(),
            } : null,
          };
        }),
      );
    },

    async gradeSubmission(data): Promise<GradeItem> {
      const [row] = await db
        .insert(grades)
        .values({
          submissionId: data.submissionId,
          marksObtained: data.marksObtained,
          feedback: data.feedback ?? null,
          gradedBy: data.gradedBy,
        })
        .returning();
      if (!row) throw new Error('Failed to grade submission');
      return {
        id: row.id,
        submissionId: row.submissionId,
        marksObtained: row.marksObtained,
        feedback: row.feedback,
        gradedBy: row.gradedBy,
        gradedAt: row.gradedAt.toISOString(),
      };
    },

    async publishResults(sectionId, publishedBy): Promise<boolean> {
      const [row] = await db
        .insert(resultPublications)
        .values({
          sectionId,
          isPublished: true,
          publishedBy,
          publishedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: resultPublications.sectionId,
          set: { isPublished: true, publishedBy, publishedAt: new Date() },
        })
        .returning();
      return !!row;
    },

    async isResultsPublished(sectionId): Promise<boolean> {
      const [row] = await db
        .select()
        .from(resultPublications)
        .where(and(eq(resultPublications.sectionId, sectionId), eq(resultPublications.isPublished, true)))
        .limit(1);
      return !!row;
    },

    async getStudentResults(studentId, sectionId) {
      const isPublished = await this.isResultsPublished(sectionId);
      const assignList = await this.listAssignments(sectionId);

      const results = await Promise.all(
        assignList.map(async a => {
          const sub = await this.getSubmission(a.id, studentId);
          return {
            assignmentTitle: a.title,
            maxMarks: a.maxMarks,
            marksObtained: isPublished ? (sub?.grade?.marksObtained ?? null) : null,
            feedback: isPublished ? (sub?.grade?.feedback ?? null) : null,
          };
        }),
      );

      return { isPublished, results };
    },
  };
}
