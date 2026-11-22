export interface DocumentRequestItem {
  id: string;
  userId: string;
  documentType: 'bonafide' | 'transcript' | 'character_certificate' | 'no_objection';
  purpose: string;
  status: 'pending' | 'approved' | 'issued' | 'rejected';
  issuedFileUrl?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface DocumentsRepository {
  createRequest(data: {
    userId: string;
    documentType: DocumentRequestItem['documentType'];
    purpose: string;
  }): Promise<DocumentRequestItem>;

  getRequestById(id: string): Promise<DocumentRequestItem | null>;

  listRequests(filters?: { userId?: string; status?: string }): Promise<DocumentRequestItem[]>;

  reviewRequest(
    id: string,
    status: 'approved' | 'issued' | 'rejected',
    reviewedBy: string,
    issuedFileUrl?: string,
  ): Promise<DocumentRequestItem | null>;
}
