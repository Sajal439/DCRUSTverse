export interface SearchResultItem {
  type: 'notice' | 'event' | 'location' | 'book';
  id: string;
  title: string;
  snippet: string;
  link: string;
}

export interface SearchRepository {
  search(query: string, userRoles: string[]): Promise<SearchResultItem[]>;
}
