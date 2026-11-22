import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ilike, or, eq, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { notices, events, campusLocations, libraryTitles } from '../../../database/schema.ts';

import type {
  SearchResultItem,
  SearchRepository,
} from '../../../types/search.ts';

export type {
  SearchResultItem,
  SearchRepository,
};

export function createDrizzleSearchRepository(db: NodePgDatabase<typeof schema>): SearchRepository {
  return {
    async search(query, userRoles) {
      if (!query || !query.trim()) return [];
      const q = `%${query.trim()}%`;
      const results: SearchResultItem[] = [];
      const isAdmin = userRoles.includes('administrator');

      // 1. Notices (enforcing role targeting)
      const noticeRows = await db
        .select()
        .from(notices)
        .where(or(ilike(notices.title, q), ilike(notices.content, q)))
        .limit(10);

      for (const n of noticeRows) {
        const targetRoles = (n.targetRoles as string[]) ?? [];
        const isPermitted = isAdmin || targetRoles.length === 0 || targetRoles.some(r => userRoles.includes(r));
        if (isPermitted) {
          results.push({
            type: 'notice',
            id: n.id,
            title: n.title,
            snippet: n.content.slice(0, 150),
            link: `/notices/${n.id}`,
          });
        }
      }

      // 2. Events (only approved)
      const eventRows = await db
        .select()
        .from(events)
        .where(or(ilike(events.title, q), ilike(events.description, q)))
        .limit(10);

      for (const e of eventRows) {
        if (e.status === 'approved' || isAdmin) {
          results.push({
            type: 'event',
            id: e.id,
            title: e.title,
            snippet: e.description.slice(0, 150),
            link: `/events/${e.id}`,
          });
        }
      }

      // 3. Locations
      const locRows = await db
        .select()
        .from(campusLocations)
        .where(or(ilike(campusLocations.name, q), ilike(campusLocations.description, q)))
        .limit(10);

      for (const l of locRows) {
        results.push({
          type: 'location',
          id: l.id,
          title: l.name,
          snippet: l.description ? l.description.slice(0, 150) : l.category,
          link: `/campus/locations/${l.id}`,
        });
      }

      // 4. Library catalogue
      const bookRows = await db
        .select()
        .from(libraryTitles)
        .where(or(ilike(libraryTitles.title, q), ilike(libraryTitles.author, q)))
        .limit(10);

      for (const b of bookRows) {
        results.push({
          type: 'book',
          id: b.id,
          title: b.title,
          snippet: `Author: ${b.author} | ISBN: ${b.isbn}`,
          link: `/library/titles/${b.id}`,
        });
      }

      return results;
    },
  };
}
