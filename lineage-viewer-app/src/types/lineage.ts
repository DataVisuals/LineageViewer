export type LayoutAlgorithm = 
  | 'hierarchical' 
  | 'circular' 
  | 'grid' 
  | 'force' 
  | 'flow' 
  | 'dag' 
  | 'sugiyama' 
  | 'manual';



export interface Dataset {
  id: string;
  name: string;
  namespace: string;
  type: string;
  columns: any[];
  schema?: {
    fields: Array<{
      name: string;
      type: string;
    }>;
  };
  facets?: {
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
  transforms?: any[];
}

export interface LineageNodeData {
  type: 'dataset' | 'job' | 'transform' | 'field';
  data: Dataset | Job | any;
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
  type: 'table' | 'column' | 'default' | 'transform';
  data?: {
    sourceColumn?: string;
    targetColumn?: string;
    transform?: any;
  };
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  jobs: Job[];
  datasets: Dataset[];
  transforms: any[];
}

export interface ViewMode {
  showColumns: boolean;
  showTransforms: boolean;
  selectedNode?: string;
  highlightedPath?: string[];
}
