export interface SurveyQuestionItem {
  id: string;
  surveyId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'text';
  options: string[];
  createdAt: string;
}

export interface SurveyItem {
  id: string;
  title: string;
  description?: string | null;
  isAnonymous: boolean;
  startsAt: string;
  endsAt: string;
  maxResponses: number;
  targetRoles: string[];
  createdBy?: string | null;
  createdAt: string;
  questions?: SurveyQuestionItem[];
}

export interface SurveyResponseItem {
  id: string;
  surveyId: string;
  questionId: string;
  respondentId?: string | null;
  responseText: string;
  submittedAt: string;
}

export interface SurveyAggregation {
  surveyId: string;
  totalResponses: number;
  questionResults: {
    questionId: string;
    questionText: string;
    questionType: string;
    answerCounts: Record<string, number>;
    textAnswers?: string[];
  }[];
}

export interface SurveysRepository {
  listSurveys(): Promise<SurveyItem[]>;
  getSurveyById(id: string): Promise<SurveyItem | null>;
  createSurvey(data: {
    title: string;
    description?: string;
    isAnonymous: boolean;
    startsAt: Date;
    endsAt: Date;
    maxResponses?: number;
    targetRoles?: string[];
    createdBy: string;
    questions: {
      questionText: string;
      questionType: 'multiple_choice' | 'text';
      options?: string[];
    }[];
  }): Promise<SurveyItem>;
  submitResponses(data: {
    surveyId: string;
    respondentId: string;
    isAnonymous: boolean;
    answers: { questionId: string; responseText: string }[];
  }): Promise<SurveyResponseItem[]>;
  getAggregation(surveyId: string): Promise<SurveyAggregation>;
}
