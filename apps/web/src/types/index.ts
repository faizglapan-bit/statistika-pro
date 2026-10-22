// Tipe data untuk aplikasi Statistika Pro

export type Language = 'id' | 'en'

export type BackendStatus = 'online' | 'offline' | 'checking' | 'local'

export type MenuId =
  | 'dashboard'
  | 'data-editor'
  | 'variable-view'
  | 'analysis'
  | 'advanced-analysis'
  | 'output'
  | 'reports'
  | 'settings'

export interface MenuItem {
  id: MenuId
  labelId: string
  labelEn: string
  icon: string
  comingSoon: boolean
  description: {
    id: string
    en: string
  }
}

export type VariableType = 'numeric' | 'string' | 'boolean'
export type VariableMeasure = 'nominal' | 'ordinal' | 'scale'

export interface VariableDefinition {
  name: string
  type: VariableType
  width: number
  decimals: number
  label: string
  values: Record<string, string> // e.g. {"1": "Sangat Tidak Setuju", "2": "Tidak Setuju"}
  missing: string[] // e.g. ["99"]
  measure: VariableMeasure
}

export interface DataRow {
  id: number
  [key: string]: string | number | null | undefined
}

// Kompatibilitas dengan DataColumn yang ada
export interface DataColumn {
  key: string
  label: string
  type: VariableType
  width: number
  measure?: VariableMeasure
  decimals?: number
}

export interface DatasetMetadata {
  id: string
  name: string
  description?: string
  row_count: number
  variable_count: number
  missing_count: number
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Dataset {
  id: string
  name: string
  description?: string
  variables: VariableDefinition[]
  rows: DataRow[]
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface ProjectState {
  id?: string
  name: string
  isSaved: boolean
  lastSaved: Date | null
  isDemo?: boolean
}

export interface ColumnPreview {
  name: string
  original_name: string
  detected_type: VariableType
  detected_measure: VariableMeasure
  missing_count: number
  sample_values: (string | number | null)[]
}

export interface ImportPreviewResponse {
  filename: string
  file_format: string
  sheet_names: string[]
  selected_sheet?: string | null
  delimiter?: string | null
  has_headers: boolean
  total_rows: number
  total_columns: number
  columns: ColumnPreview[]
  preview_rows: DataRow[]
  warnings: string[]
}

export interface HealthResponse {
  status: string
  version: string
  timestamp: string
  services: {
    api: string
  }
}

export type AnalysisType =
  | 'descriptive'
  | 'validity'
  | 'reliability'
  | 'correlation'
  | 'regression'
  | 'diagnostics'

export interface AnalysisOutputMetadata {
  id: string
  title: string
  analysis_type: AnalysisType
  dataset_id: string
  dataset_name: string
  dataset_updated_at?: string | null
  sample_size: number
  variables: string[]
  created_at: string
}

export interface AnalysisOutputCreate {
  title: string
  analysis_type: AnalysisType
  dataset_id: string
  dataset_name: string
  dataset_updated_at?: string | null
  sample_size: number
  variables: string[]
  parameters: Record<string, any>
  results: Record<string, any>
  warnings: string[]
  interpretation?: string | null
}

export interface AnalysisOutput extends AnalysisOutputCreate {
  id: string
  created_at: string
}

// ==========================================
// Tipe Tahap 5: Transformasi Data & Kasus
// ==========================================

export interface ComputeVariablePayload {
  target_variable: string
  target_label?: string
  expression: string
  preview_only?: boolean
  save_as_new_dataset?: boolean
  new_dataset_name?: string
}

export interface RecodeRule {
  rule_type: 'single' | 'range' | 'lowest_thru' | 'thru_highest' | 'else'
  old_value?: number | string | null
  range_min?: number
  range_max?: number
  new_value?: number | string | null
  is_missing?: boolean
}

export interface RecodeVariablePayload {
  source_variable: string
  target_variable: string
  target_label?: string
  target_type: 'numeric' | 'string'
  rules: RecodeRule[]
  preview_only?: boolean
  save_as_new_dataset?: boolean
  new_dataset_name?: string
}

export interface ReverseScorePayload {
  source_variables: string[]
  scale_min: number
  scale_max: number
  target_prefix: string
  preview_only?: boolean
  save_as_new_dataset?: boolean
  new_dataset_name?: string
}

export interface CompositeScorePayload {
  target_variable: string
  target_label?: string
  source_variables: string[]
  method: 'mean' | 'sum'
  min_valid_items?: number
  min_valid_percent?: number
  preview_only?: boolean
  save_as_new_dataset?: boolean
  new_dataset_name?: string
}

export interface StandardizePayload {
  source_variables: string[]
  target_prefix: string
  preview_only?: boolean
  save_as_new_dataset?: boolean
  new_dataset_name?: string
}

export interface CategorizePayload {
  source_variable: string
  target_variable: string
  target_label?: string
  method: 'cutpoints' | 'equal_intervals' | 'percentiles'
  intervals_count?: number
  cutpoints?: number[]
  category_labels?: string[]
  preview_only?: boolean
  save_as_new_dataset?: boolean
  new_dataset_name?: string
}

export interface TransformationPreviewResponse {
  target_variable: string
  preview_rows: DataRow[]
  valid_count: number
  missing_count: number
  warnings: string[]
  summary_stats?: Record<string, any>
}

export interface TransformationApplyResponse {
  success: boolean
  message: string
  operation_id: string
  dataset_id: string
  version_id: string
  affected_rows: number
  new_variables: string[]
  warnings: string[]
  new_dataset_id?: string | null
}

export interface TransformationHistoryItem {
  snapshot_id: string
  dataset_id: string
  timestamp: string
  operation_type: string
  description: string
  affected_rows: number
  source_vars: string[]
  target_vars: string[]
  row_count: number
  variable_count: number
}

export interface SortVariableItem {
  name: string
  ascending: boolean
}

export interface SortCasesPayload {
  sort_variables: SortVariableItem[]
  save_as_new_dataset?: boolean
  new_dataset_name?: string
}

export interface FilterCasesPayload {
  condition_expression: string
  mode: 'temporary' | 'new_dataset'
  new_dataset_name?: string
}

export interface FilterCasesResponse {
  total_cases: number
  matched_cases: number
  excluded_cases: number
  matched_row_ids: (number | string)[]
  new_dataset_id?: string | null
  warnings: string[]
}

export interface DuplicateDetectionResponse {
  total_rows: number
  duplicate_rows_count: number
  unique_rows_count: number
  duplicate_row_indices: number[]
  sample_duplicate_groups: {
    keys: Record<string, any>
    count: number
    row_ids: (number | string)[]
  }[]
}

export interface VariableMissingDetail {
  variable_name: string
  variable_label?: string
  total_count: number
  valid_count: number
  missing_count: number
  missing_percentage: number
}

export interface MissingSummaryResponse {
  total_rows: number
  total_columns: number
  total_cells: number
  total_missing_cells: number
  overall_missing_percentage: number
  rows_with_any_missing_count: number
  rows_with_any_missing_percentage: number
  variables: VariableMissingDetail[]
}

export interface ReportMetadata {
  title?: string
  researcher?: string
  institution?: string
  period?: string
  notes?: string
}

export interface ReportGeneratePayload {
  dataset_id: string
  metadata: ReportMetadata
  sections: string[]
  format: 'pdf' | 'docx' | 'xlsx'
  include_transformation_history: boolean
}

export interface ReportSectionItem {
  id: string
  title: string
  available: boolean
  description: string
}

export interface AvailableSectionsResponse {
  dataset_id: string
  dataset_name: string
  sections: ReportSectionItem[]
}

// ==========================================
// TAHAP 6 — MODUL STATISTIK LANJUTAN TYPES
// ==========================================

export interface OneSampleTTestPayload {
  variable: string
  test_value: number
  confidence_level?: number
}

export interface IndependentTTestPayload {
  test_variable: string
  grouping_variable: string
  group1_val?: any
  group2_val?: any
  confidence_level?: number
}

export interface PairedTTestPayload {
  variable1: string
  variable2: string
  confidence_level?: number
}

export interface AnovaPayload {
  dependent_variable: string
  factor_variable: string
  post_hoc?: 'auto' | 'tukey' | 'games-howell' | 'none'
  confidence_level?: number
}

export interface MannWhitneyPayload {
  test_variable: string
  grouping_variable: string
  group1_val?: any
  group2_val?: any
}

export interface WilcoxonPayload {
  variable1: string
  variable2: string
}

export interface KruskalWallisPayload {
  dependent_variable: string
  factor_variable: string
}

export interface FriedmanPayload {
  variables: string[]
}

export interface KendallTauPayload {
  variable1: string
  variable2: string
}

export interface CrosstabsPayload {
  row_variable: string
  column_variable: string
}

export interface LogisticRegressionPayload {
  dependent_variable: string
  independent_variables: string[]
  categorical_variables?: string[]
  reference_category?: 'first' | 'last'
  cutoff?: number
}

export interface ChartRequestPayload {
  chart_type: 'histogram' | 'boxplot' | 'scatter' | 'bar' | 'heatmap' | 'qq_plot'
  variable?: string
  x_variable?: string
  y_variable?: string
  category_variable?: string
  numeric_variable?: string
  variables?: string[]
  bins_count?: number
  include_regression_line?: boolean
  stat_type?: 'mean' | 'count' | 'sum'
  method?: 'pearson' | 'spearman'
}

export interface AdvancedAnalysisResult {
  title: string
  summary: Record<string, any>
  tables: {
    title: string
    rows: Record<string, any>[]
  }[]
  interpretation: string
  warnings: string[]
  output_id?: string
}

export * from './project'

