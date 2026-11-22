import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../../database/schema.ts';
import { departments, campusLocations, notices, libraryTitles } from '../../../database/schema.ts';

import type {
  AiSourceCitation,
  AiResponse,
  AiAssistantRepository,
} from '../../../types/ai.ts';

export type {
  AiSourceCitation,
  AiResponse,
  AiAssistantRepository,
};

export function createDrizzleAiAssistantRepository(db: NodePgDatabase<typeof schema>): AiAssistantRepository {
  return {
    async answerQuery(query: string, userRoles: string[], _userId: string): Promise<AiResponse> {
      const qLower = query.toLowerCase().trim();

      // Guardrail: Detect attempt to retrieve private student or personal data
      if (
        qLower.includes('other student') ||
        qLower.includes('grades of') ||
        qLower.includes('private record') ||
        qLower.includes('password') ||
        qLower.includes('reset token')
      ) {
        return {
          answer: 'I cannot provide private student records, grades, or personal security credentials. All student academic and personal information is strictly private and protected by university policy.',
          sources: [],
          missingInformationAcknowledged: false,
        };
      }

      const sources: AiSourceCitation[] = [];

      // 1. Search departments
      const depts = await db.select().from(departments);
      for (const d of depts) {
        if (qLower.includes(d.name.toLowerCase()) || qLower.includes(d.code.toLowerCase())) {
          sources.push({
            title: d.name,
            category: 'Department',
            snippet: `${d.name} (${d.code}) is an academic department at DCRUST.`,
            verified: true,
          });
        }
      }

      // 2. Search campus locations
      const locs = await db.select().from(campusLocations);
      for (const l of locs) {
        if (qLower.includes(l.name.toLowerCase()) || (l.building && qLower.includes(l.building.toLowerCase()))) {
          sources.push({
            title: l.name,
            category: 'Campus Location',
            snippet: `${l.name} (${l.category}) in ${l.building} - ${l.description ?? 'Campus facility'}. Hours: ${l.openingHours ?? 'Regular campus hours'}.`,
            verified: true,
          });
        }
      }

      // 3. Search library
      if (qLower.includes('library') || qLower.includes('book')) {
        const books = await db.select().from(libraryTitles).limit(3);
        const bookList = books.map(b => `"${b.title}" by ${b.author}`).join(', ');
        sources.push({
          title: 'Central Library Catalogue',
          category: 'Library',
          snippet: `Central Library is open 8:00 AM - 8:00 PM. Sample holdings include: ${bookList || 'Extensive academic texts'}.`,
          verified: true,
        });
      }

      // 4. Search permitted notices
      const allNotices = await db.select().from(notices);
      for (const n of allNotices) {
        const targetRoles = (n.targetRoles as string[]) ?? [];
        const isPermitted = targetRoles.length === 0 || targetRoles.some(r => userRoles.includes(r));
        if (isPermitted && (qLower.includes(n.title.toLowerCase()) || qLower.includes('notice') || qLower.includes('announcement'))) {
          sources.push({
            title: n.title,
            category: 'Official Notice',
            snippet: n.content.slice(0, 200),
            verified: true,
          });
        }
      }

      if (sources.length === 0) {
        return {
          answer: 'I do not have authoritative campus information regarding this topic in our verified knowledge base. Please check with the respective department office or university administration.',
          sources: [],
          missingInformationAcknowledged: true,
        };
      }

      const answer = sources.map(s => s.snippet).join('\n\n');
      return {
        answer,
        sources,
        missingInformationAcknowledged: false,
      };
    },
  };
}
