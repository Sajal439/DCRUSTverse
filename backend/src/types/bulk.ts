export interface CsvUserRow {
  email: string;
  displayName: string;
  departmentCode?: string;
  role?: string;
}

export interface ValidationSummary<T> {
  totalRows: number;
  validCount: number;
  errorCount: number;
  validRows: T[];
  errors: Array<{ rowNumber: number; reason: string }>;
}
