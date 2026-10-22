import { Dataset, VariableDefinition, DataRow } from './index'

export interface ProjectMetadata {
  id: string
  name: string
  description?: string
  active_dataset_id?: string
  dataset_name?: string
  row_count: number
  variable_count: number
  output_count: number
  created_at: string
  updated_at: string
}

export interface ProjectDetail {
  id: string
  name: string
  description: string
  active_dataset_id?: string
  dataset?: Dataset
  outputs: any[]
  audit_log: any[]
  created_at: string
  updated_at: string
}

export interface ProjectCreatePayload {
  name: string
  description?: string
  dataset_id?: string
}

export interface ProjectUpdatePayload {
  name?: string
  description?: string
  active_dataset_id?: string
  dataset?: {
    name?: string
    description?: string
    variables?: VariableDefinition[]
    rows?: DataRow[]
  }
}
