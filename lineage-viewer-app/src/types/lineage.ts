export type LayoutAlgorithm = 
  | 'hierarchical' 
  | 'circular' 
  | 'grid' 
  | 'force' 
  | 'flow' 
  | 'dag' 
  | 'sugiyama' 
  | 'manual';

export interface ColumnLineage {
  inputField: {
    namespace: string;
    name: string;
    field: string;
  };
  outputField: {
    namespace: string;
    name: string;
    field: string;
  };
  transformType: 'DIRECT_COPY' | 'AGGREGATION' | 'CALCULATION' | 'CONDITIONAL' | 'JOIN' | 'FILTER' | 'OTHER';
  description: string;
  sql?: string;
}

export interface ColumnTransform {
  id: string;
  name: string;
  transformType: string;
  transform: string;
  description: string;
  inputFields: Array<{
    namespace: string;
    name: string;
    field: string;
  }>;
  outputField?: string;
  dataset?: string;
  sourceCode?: string;
  sourceFile?: string;
  language?: string;
  sql?: string;
  pythonCode?: string;
  sparkCode?: string;
  columnLineage?: ColumnLineage[];
}

export interface Dataset {
  id: string;
  name: string;
  namespace: string;
  type: string;
  columns: ColumnTransform[];
  schema?: {
    fields: Array<{
      name: string;
      type: string;
    }>;
  };
  facets?: {
    columnLineage?: {
      fields: Record<string, {
        inputFields: Array<{
          name: string;
          field: string;
          namespace: string;
        }>;
        transformationType: string;
        transformationDescription: string;
        transformation?: string;
      }>;
    };
  };
}

export interface Job {
  id: string;
  name: string;
  namespace: string;
  type: string;
  inputs: string[];
  outputs: string[];
  description?: string;
  sourceCode?: {
    language: string;
    source: string;
  };
  sql?: string;
  pythonCode?: string;
  sparkCode?: string;
  sourceFile?: string;
  language?: string;
  transforms?: ColumnTransform[];
}

export interface LineageNodeData {
  type: 'dataset' | 'job' | 'transform' | 'field';
  data: Dataset | Job | ColumnTransform | any;
}

export interface LineageNode {
  id: string;
  type: 'lineageNode';
  data: LineageNodeData;
  position: { x: number; y: number };
  draggable?: boolean;
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  type: 'table' | 'column' | 'default';
  data?: {
    sourceColumn?: string;
    targetColumn?: string;
    transform?: ColumnTransform;
  };
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  jobs: Job[];
  datasets: Dataset[];
  transforms: ColumnTransform[];
}

export interface ViewMode {
  showColumns: boolean;
  showTransforms: boolean;
  selectedNode?: string;
  highlightedPath?: string[];
}
