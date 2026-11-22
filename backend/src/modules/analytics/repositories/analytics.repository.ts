import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql, eq } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import {
  attendanceRecords,
  hostels,
  hostelRooms,
  hostelAllocations,
  tickets,
  events,
  eventRegistrations,
  placementOpportunities,
  placementApplications,
} from '../../../database/schema.ts';

import type {
  AnalyticsSummary,
  AnalyticsRepository,
} from '../../../types/analytics.ts';

export type {
  AnalyticsSummary,
  AnalyticsRepository,
};

export function createDrizzleAnalyticsRepository(db: NodePgDatabase<typeof schema>): AnalyticsRepository {
  return {
    async getCampusAnalytics() {
      // 1. Attendance
      const [attTotal] = await db.select({ count: sql<number>`count(*)::int` }).from(attendanceRecords);
      const [attPresent] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.status, 'present'));

      const totalAtt = attTotal?.count ?? 0;
      const presentAtt = attPresent?.count ?? 0;
      const absentAtt = totalAtt - presentAtt;
      const overallPercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

      // 2. Hostel Occupancy
      const hostelList = await db.select().from(hostels);
      const hostelStats = [];
      for (const h of hostelList) {
        const rooms = await db.select().from(hostelRooms).where(eq(hostelRooms.hostelId, h.id));
        const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
        const [activeAlloc] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(hostelAllocations)
          .innerJoin(hostelRooms, eq(hostelRooms.id, hostelAllocations.roomId))
          .where(eq(hostelRooms.hostelId, h.id));
        const occupied = activeAlloc?.count ?? 0;
        hostelStats.push({
          hostelId: h.id,
          hostelName: h.name,
          totalCapacity,
          occupiedCount: occupied,
          occupancyRate: totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0,
        });
      }

      // 3. Complaint resolution
      const [totalT] = await db.select({ count: sql<number>`count(*)::int` }).from(tickets);
      const [openT] = await db.select({ count: sql<number>`count(*)::int` }).from(tickets).where(eq(tickets.status, 'open'));
      const [inProgT] = await db.select({ count: sql<number>`count(*)::int` }).from(tickets).where(eq(tickets.status, 'in_progress'));
      const [resT] = await db.select({ count: sql<number>`count(*)::int` }).from(tickets).where(eq(tickets.status, 'resolved'));

      // 4. Events
      const [evTotal] = await db.select({ count: sql<number>`count(*)::int` }).from(events);
      const [regTotal] = await db.select({ count: sql<number>`count(*)::int` }).from(eventRegistrations);

      // 5. Placements
      const [oppTotal] = await db.select({ count: sql<number>`count(*)::int` }).from(placementOpportunities);
      const [appTotal] = await db.select({ count: sql<number>`count(*)::int` }).from(placementApplications);
      const [shortlisted] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(placementApplications)
        .where(eq(placementApplications.status, 'shortlisted'));
      const [selected] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(placementApplications)
        .where(eq(placementApplications.status, 'selected'));

      return {
        attendance: {
          totalRecords: totalAtt,
          presentCount: presentAtt,
          absentCount: absentAtt,
          overallPercentage,
        },
        hostelOccupancy: hostelStats,
        complaintResolution: {
          totalTickets: totalT?.count ?? 0,
          openTickets: openT?.count ?? 0,
          inProgressTickets: inProgT?.count ?? 0,
          resolvedTickets: resT?.count ?? 0,
        },
        eventParticipation: {
          totalEvents: evTotal?.count ?? 0,
          totalRegistrations: regTotal?.count ?? 0,
        },
        placements: {
          totalOpportunities: oppTotal?.count ?? 0,
          totalApplications: appTotal?.count ?? 0,
          shortlistedCount: shortlisted?.count ?? 0,
          selectedCount: selected?.count ?? 0,
        },
      };
    },
  };
}
