export interface PlacementOpportunityItem {
  id: string;
  companyName: string;
  title: string;
  description: string;
  minCgpa: number; // scaled by 100
  eligibleBranches: string[];
  deadline: string;
  packageDetails?: string | null;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface PlacementApplicationItem {
  id: string;
  opportunityId: string;
  studentId: string;
  cgpa: number;
  branch: string;
  status: 'applied' | 'shortlisted' | 'selected' | 'rejected';
  appliedAt: string;
}

export interface PlacementsRepository {
  listOpportunities(status?: string): Promise<PlacementOpportunityItem[]>;
  createOpportunity(data: {
    companyName: string;
    title: string;
    description: string;
    minCgpa: number;
    eligibleBranches: string[];
    deadline: Date;
    packageDetails?: string;
    createdBy: string;
  }): Promise<PlacementOpportunityItem>;
  getOpportunityById(id: string): Promise<PlacementOpportunityItem | null>;

  apply(data: {
    opportunityId: string;
    studentId: string;
    cgpa: number;
    branch: string;
  }): Promise<PlacementApplicationItem>;

  listApplications(filters?: { opportunityId?: string; studentId?: string }): Promise<PlacementApplicationItem[]>;
  updateApplicationStatus(id: string, status: 'applied' | 'shortlisted' | 'selected' | 'rejected'): Promise<PlacementApplicationItem | null>;
}
