export interface TicketItem {
  id: string;
  trackingId: string;
  creatorId: string;
  category: 'hostel' | 'academic' | 'facility' | 'harassment' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  isSensitive: boolean;
  assignedStaffId?: string | null;
  title: string;
  description: string;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCommentItem {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketsRepository {
  createTicket(data: {
    creatorId: string;
    category: 'hostel' | 'academic' | 'facility' | 'harassment' | 'general';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    isSensitive?: boolean;
    title: string;
    description: string;
  }): Promise<TicketItem>;

  getTicketById(id: string): Promise<TicketItem | null>;
  getTicketByTrackingId(trackingId: string): Promise<TicketItem | null>;

  listTickets(filters?: {
    creatorId?: string;
    assignedStaffId?: string;
    category?: string;
    status?: string;
  }): Promise<TicketItem[]>;

  updateStatus(
    id: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened',
    resolutionNotes?: string,
  ): Promise<TicketItem | null>;

  assignStaff(id: string, staffId: string): Promise<TicketItem | null>;

  addComment(data: {
    ticketId: string;
    userId: string;
    message: string;
    isInternal?: boolean;
  }): Promise<TicketCommentItem>;

  listComments(ticketId: string, includeInternal?: boolean): Promise<TicketCommentItem[]>;
}
