export interface LostFoundItemRecord {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  locationFound: string;
  status: 'open' | 'claimed' | 'recovered';
  reportedBy: string;
  reportedAt: string;
}

export interface LostFoundClaimRecord {
  id: string;
  itemId: string;
  claimantId: string;
  proofDescription: string;
  status: 'pending' | 'verified' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface LostFoundRepository {
  listItems(filters?: { type?: 'lost' | 'found'; category?: string; status?: string }): Promise<LostFoundItemRecord[]>;
  getItemById(id: string): Promise<LostFoundItemRecord | null>;
  createItem(data: {
    type: 'lost' | 'found';
    title: string;
    description: string;
    category: string;
    locationFound: string;
    reportedBy: string;
  }): Promise<LostFoundItemRecord>;
  submitClaim(data: { itemId: string; claimantId: string; proofDescription: string }): Promise<LostFoundClaimRecord>;
  listClaimsForItem(itemId: string): Promise<LostFoundClaimRecord[]>;
  reviewClaim(claimId: string, reviewerId: string, status: 'verified' | 'rejected'): Promise<LostFoundClaimRecord | null>;
  markItemRecovered(itemId: string): Promise<LostFoundItemRecord | null>;
}
