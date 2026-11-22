import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import type * as schema from '../../../database/schema.ts';
import {
  campusLocations,
  locationEntrances,
  pathSegments,
  qrLocationLinks,
} from '../../../database/schema.ts';

import type {
  CampusCategory,
  LocationRecord,
  EntranceRecord,
  PathSegmentRecord,
  RouteResult,
  QrLinkRecord,
  CampusRepository,
} from '../../../types/campus.ts';

export type {
  CampusCategory,
  LocationRecord,
  EntranceRecord,
  PathSegmentRecord,
  RouteResult,
  QrLinkRecord,
  CampusRepository,
};

export function createDrizzleCampusRepository(db: NodePgDatabase<typeof schema>): CampusRepository {
  return {
    async listPaths() {
      const rows = await db.select().from(pathSegments);
      return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
    },
    async listLocations(filters = {}) {
      const conditions = [];
      if (filters.category) conditions.push(eq(campusLocations.category, filters.category));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(campusLocations).where(whereClause);
      return rows.map(r => ({
        ...r,
        category: r.category as CampusCategory,
        coordinates: (r.coordinates as Record<string, any>) ?? {},
        createdAt: r.createdAt.toISOString(),
      }));
    },
    async getLocationById(id) {
      const [loc] = await db.select().from(campusLocations).where(eq(campusLocations.id, id)).limit(1);
      if (!loc) return null;
      const entrances = await db.select().from(locationEntrances).where(eq(locationEntrances.locationId, id));
      return {
        ...loc,
        category: loc.category as CampusCategory,
        coordinates: (loc.coordinates as Record<string, any>) ?? {},
        entrances: entrances.map(e => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
        createdAt: loc.createdAt.toISOString(),
      };
    },
    async createLocation(data) {
      const [row] = await db
        .insert(campusLocations)
        .values({
          ...data,
          code: data.code.toUpperCase().trim(),
        })
        .returning();
      if (!row) throw new Error('Failed to create location');
      return {
        ...row,
        category: row.category as CampusCategory,
        coordinates: (row.coordinates as Record<string, any>) ?? {},
        createdAt: row.createdAt.toISOString(),
      };
    },
    async addEntrance(data) {
      const [row] = await db.insert(locationEntrances).values(data).returning();
      if (!row) throw new Error('Failed to add entrance');
      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
      };
    },
    async addPathSegment(data) {
      const [row] = await db.insert(pathSegments).values(data).returning();
      if (!row) throw new Error('Failed to add path segment');
      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
      };
    },
    async findRoute(fromLocationId, toLocationId, accessibleOnly) {
      if (fromLocationId === toLocationId) {
        return { found: true, totalDistanceMeters: 0, isAccessible: true, path: [fromLocationId] };
      }

      const allSegments = await db.select().from(pathSegments);
      const filtered = accessibleOnly ? allSegments.filter(s => s.isAccessible) : allSegments;

      const adj = new Map<string, { to: string; dist: number; isAccessible: boolean }[]>();
      for (const s of filtered) {
        if (!adj.has(s.fromLocationId)) adj.set(s.fromLocationId, []);
        if (!adj.has(s.toLocationId)) adj.set(s.toLocationId, []);
        adj.get(s.fromLocationId)!.push({ to: s.toLocationId, dist: s.distanceMeters, isAccessible: s.isAccessible });
        adj.get(s.toLocationId)!.push({ to: s.fromLocationId, dist: s.distanceMeters, isAccessible: s.isAccessible });
      }

      const distances = new Map<string, number>();
      const prev = new Map<string, string>();
      const visited = new Set<string>();

      distances.set(fromLocationId, 0);

      while (true) {
        let closestNode: string | null = null;
        let shortestDist = Infinity;

        for (const [node, dist] of distances.entries()) {
          if (!visited.has(node) && dist < shortestDist) {
            shortestDist = dist;
            closestNode = node;
          }
        }

        if (!closestNode || shortestDist === Infinity) break;
        if (closestNode === toLocationId) break;

        visited.add(closestNode);
        const neighbors = adj.get(closestNode) ?? [];
        for (const edge of neighbors) {
          if (visited.has(edge.to)) continue;
          const newDist = shortestDist + edge.dist;
          if (newDist < (distances.get(edge.to) ?? Infinity)) {
            distances.set(edge.to, newDist);
            prev.set(edge.to, closestNode);
          }
        }
      }

      if (!distances.has(toLocationId)) {
        return {
          found: false,
          totalDistanceMeters: 0,
          isAccessible: false,
          path: [],
          missingRouteData: true,
        };
      }

      const path: string[] = [];
      let curr: string | undefined = toLocationId;
      while (curr) {
        path.unshift(curr);
        curr = prev.get(curr);
      }

      return {
        found: true,
        totalDistanceMeters: distances.get(toLocationId)!,
        isAccessible: path.every((node, i) => i === 0 || filtered.some(edge => edge.isAccessible && ((edge.fromLocationId === path[i - 1] && edge.toLocationId === node) || (edge.toLocationId === path[i - 1] && edge.fromLocationId === node)))),
        path,
      };
    },
    async createQrLink(locationId) {
      const qrToken = `dcrust_loc_${randomBytes(12).toString('hex')}`;
      const [row] = await db
        .insert(qrLocationLinks)
        .values({
          locationId,
          qrToken,
          scanCount: 0,
        })
        .returning();
      if (!row) throw new Error('Failed to generate QR link');
      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
      };
    },
    async resolveQrScan(qrToken) {
      const [qr] = await db
        .select()
        .from(qrLocationLinks)
        .where(eq(qrLocationLinks.qrToken, qrToken))
        .limit(1);

      if (!qr) return null;

      await db
        .update(qrLocationLinks)
        .set({
          scanCount: qr.scanCount + 1,
        })
        .where(eq(qrLocationLinks.id, qr.id));

      const location = await this.getLocationById(qr.locationId);
      return {
        qr: {
          ...qr,
          scanCount: qr.scanCount + 1,
          createdAt: qr.createdAt.toISOString(),
        },
        location,
      };
    },
  };
}
