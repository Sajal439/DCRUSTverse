export interface AnalyticsSummary {
  attendance: {
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    overallPercentage: number;
  };
  hostelOccupancy: {
    hostelId: string;
    hostelName: string;
    totalCapacity: number;
    occupiedCount: number;
    occupancyRate: number;
  }[];
  complaintResolution: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
  };
  eventParticipation: {
    totalEvents: number;
    totalRegistrations: number;
  };
  placements: {
    totalOpportunities: number;
    totalApplications: number;
    shortlistedCount: number;
    selectedCount: number;
  };
}

export interface AnalyticsRepository {
  getCampusAnalytics(): Promise<AnalyticsSummary>;
}
