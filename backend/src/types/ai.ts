export interface AiSourceCitation {
  title: string;
  category: string;
  snippet: string;
  verified: boolean;
}

export interface AiResponse {
  answer: string;
  sources: AiSourceCitation[];
  missingInformationAcknowledged: boolean;
}

export interface AiAssistantRepository {
  answerQuery(query: string, userRoles: string[], userId: string): Promise<AiResponse>;
}
