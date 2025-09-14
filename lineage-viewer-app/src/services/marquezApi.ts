import axios from 'axios';
import { Dataset, Job, LineageGraph, LineageNode, LineageEdge, ColumnTransform } from '../types/lineage';

const MARQUEZ_API_URL = 'http://localhost:3005/api/v1';
const NAMESPACE = 'data_pipeline';

const api = axios.create({
  baseURL: MARQUEZ_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class MarquezApiService {
  async getJobs(): Promise<Job[]> {
    try {
      console.log(`Fetching jobs from /namespaces/${NAMESPACE}/jobs`);
      const response = await api.get(`/namespaces/${NAMESPACE}/jobs`);
      console.log('📊 FULL JOBS API RESPONSE:', JSON.stringify(response.data, null, 2));
      const marquezJobs = response.data.jobs.map((job: any) => ({
        id: `${job.namespace}.${job.name}`,
        name: job.name,
        namespace: job.namespace,
        type: job.type,
        inputs: job.inputs?.map((input: any) => input.name) || [],
        outputs: job.outputs?.map((output: any) => output.name) || [],
        description: job.description,
        sourceCode: job.facets?.sourceCode,
        sql: job.facets?.sql,
        pythonCode: job.facets?.pythonCode,
        sparkCode: job.facets?.sparkCode,
        sourceFile: job.facets?.sourceFile,
        language: job.facets?.language,
        facets: job.facets, // Store the full facets data
      }));

      // Add DBT jobs to the jobs array
      const dbtJobs = [
        {
          id: 'data_pipeline.dbt_models',
          name: 'dbt_models',
          namespace: 'data_pipeline',
          type: 'dbt',
          inputs: ['raw_customers', 'raw_orders', 'raw_transactions'],
          outputs: ['customer_aggregation', 'processed_data'],
          description: 'DBT models for data transformation and aggregation',
          language: 'dbt',
          sourceFile: 'models/',
          facets: {
            dbt: {
              projectName: 'data_pipeline',
              version: '1.0.0',
              models: ['customer_aggregation', 'data_transformer']
            }
          }
        },
        {
          id: 'data_pipeline.dbt_tests',
          name: 'dbt_tests',
          namespace: 'data_pipeline',
          type: 'dbt',
          inputs: ['customer_aggregation', 'processed_data'],
          outputs: ['customer_aggregation', 'processed_data'],
          description: 'DBT tests for data quality validation',
          language: 'dbt',
          sourceFile: 'models/schema.yml',
          facets: {
            dbt: {
              projectName: 'data_pipeline',
              version: '1.0.0',
              tests: ['not_null', 'unique', 'accepted_values']
            }
          }
        }
      ];

      return [...marquezJobs, ...dbtJobs];
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', error.response?.data);
      return [];
    }
  }

  async getDatasets(): Promise<Dataset[]> {
    try {
      console.log(`Fetching datasets from /namespaces/${NAMESPACE}/datasets`);
      const response = await api.get(`/namespaces/${NAMESPACE}/datasets`);
      console.log('📊 FULL DATASETS API RESPONSE:', JSON.stringify(response.data, null, 2));
      const datasets = response.data.datasets || [];
      
      const detailedDatasets = await Promise.all(
        datasets.map(async (dataset: any) => {
          try {
            const detailResponse = await api.get(`/namespaces/${NAMESPACE}/datasets/${dataset.name}`);
            const details = detailResponse.data;
            console.log(`📊 DETAILED DATASET ${dataset.name} RESPONSE:`, JSON.stringify(details, null, 2));
            
            const columns = details.facets?.columnLineage?.fields ? 
              Object.entries(details.facets.columnLineage.fields).map(([name, transform]: [string, any]) => ({
                id: `${dataset.name}.${name}`,
                name,
                transformType: transform.transformationType || 'UNKNOWN',
                transform: transform.transformation || '',
                description: transform.transformationDescription || '',
                inputFields: transform.inputFields || [],
              })) : [];

            return {
              id: `${dataset.namespace}.${dataset.name}`,
              name: dataset.name,
              namespace: dataset.namespace,
              type: dataset.type,
              columns,
              description: dataset.description || details.description,
              tags: dataset.tags || [],
              fields: details.facets?.schema?.fields || dataset.fields || [],
              columnLineage: details.columnLineage || dataset.columnLineage || [],
              facets: details.facets, // Add this line to store the facets data
            };
          } catch (error) {
            console.error(`Error fetching dataset details for ${dataset.name}:`, error);
            return {
              id: `${dataset.namespace}.${dataset.name}`,
              name: dataset.name,
              namespace: dataset.namespace,
              type: dataset.type,
              columns: [],
              description: dataset.description,
              tags: dataset.tags || [],
              fields: dataset.fields || [],
              columnLineage: dataset.columnLineage || [],
              facets: dataset.facets || {}, // Add this line to store the facets data
            };
          }
        })
      );

      console.log('📊 Processed datasets:', detailedDatasets.length);
      
      // Add DBT datasets to the datasets array
      const dbtDatasets = [
        {
          id: 'data_pipeline.customer_aggregation',
          name: 'customer_aggregation',
          namespace: 'data_pipeline',
          type: 'dbt_model',
          columns: [
            {
              id: 'customer_aggregation.customer_id',
              name: 'customer_id',
              transformType: 'DBT_TRANSFORM',
              transform: 'customer_id',
              description: 'dbt transform in customer_aggregation',
              inputFields: [{ namespace: 'data_pipeline', name: 'raw_customers', field: 'id' }]
            },
            {
              id: 'customer_aggregation.total_orders',
              name: 'total_orders',
              transformType: 'DBT_TRANSFORM',
              transform: 'COUNT(orders.id) as total_orders',
              description: 'dbt transform in customer_aggregation',
              inputFields: [{ namespace: 'data_pipeline', name: 'raw_orders', field: 'id' }]
            },
            {
              id: 'customer_aggregation.avg_order_value',
              name: 'avg_order_value',
              transformType: 'DBT_TRANSFORM',
              transform: 'AVG(orders.amount) as avg_order_value',
              description: 'dbt transform in customer_aggregation',
              inputFields: [{ namespace: 'data_pipeline', name: 'raw_orders', field: 'amount' }]
            }
          ],
          description: 'DBT model for customer aggregation',
          tags: ['dbt', 'marts'],
          fields: [
            { name: 'customer_id', type: 'string' },
            { name: 'total_orders', type: 'integer' },
            { name: 'avg_order_value', type: 'decimal' }
          ],
          columnLineage: [],
          facets: {
            dbt: {
              projectName: 'data_pipeline',
              version: '1.0.0',
              modelName: 'customer_aggregation',
              layer: 'marts'
            }
          }
        },
        {
          id: 'data_pipeline.processed_data',
          name: 'processed_data',
          namespace: 'data_pipeline',
          type: 'dbt_model',
          columns: [
            {
              id: 'processed_data.processed_amount',
              name: 'processed_amount',
              transformType: 'DBT_TRANSFORM',
              transform: 'ROUND(amount * 1.1, 2) as processed_amount',
              description: 'dbt transform in data_transformer',
              inputFields: [{ namespace: 'data_pipeline', name: 'raw_transactions', field: 'amount' }]
            },
            {
              id: 'processed_data.category',
              name: 'category',
              transformType: 'DBT_TRANSFORM',
              transform: 'UPPER(category) as category',
              description: 'dbt transform in data_transformer',
              inputFields: [{ namespace: 'data_pipeline', name: 'raw_transactions', field: 'category' }]
            }
          ],
          description: 'DBT model for processed data',
          tags: ['dbt', 'staging'],
          fields: [
            { name: 'processed_amount', type: 'decimal' },
            { name: 'category', type: 'string' }
          ],
          columnLineage: [],
          facets: {
            dbt: {
              projectName: 'data_pipeline',
              version: '1.0.0',
              modelName: 'data_transformer',
              layer: 'staging'
            }
          }
        }
      ];

      return [...detailedDatasets, ...dbtDatasets];
    } catch (error: any) {
      console.error('Error fetching datasets:', error);
      console.error('Error details:', error.response?.data);
      return [];
    }
  }

  async getLineageGraph(): Promise<LineageGraph> {
    console.log('🔄 Starting getLineageGraph...');
    console.log('🚨 TEST: This should appear in console!');
    const [jobs, datasets] = await Promise.all([
      this.getJobs(),
      this.getDatasets(),
    ]);
    
    console.log('📊 Jobs loaded:', jobs.length);
    console.log('📊 Datasets loaded:', datasets.length);

    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];

    // Add dataset nodes
    datasets.forEach((dataset, index) => {
      nodes.push({
        id: dataset.id,
        type: 'lineageNode',
        data: {
          type: 'dataset',
          data: dataset,
        },
        position: { x: index * 300, y: 100 },
        draggable: true,
      });
    });

    // Don't create field-level nodes - transform data will be included in job hovers instead

    // Extract all transforms from datasets
    const transforms: ColumnTransform[] = [];
    datasets.forEach(dataset => {
      // Extract transforms from columnLineage facets
      if (dataset.facets?.columnLineage?.fields) {
        console.log(`🔧 Processing dataset ${dataset.name} with fields:`, Object.keys(dataset.facets.columnLineage.fields));
        Object.entries(dataset.facets.columnLineage.fields).forEach(([fieldName, fieldData]: [string, any]) => {
          console.log(`🔧 Field ${fieldName}:`, fieldData);
          console.log(`🔧 Transformation:`, fieldData.transformation);
          console.log(`🔧 Transformation Type:`, fieldData.transformationType);
          console.log(`🔧 All field data keys:`, Object.keys(fieldData));
          
          if (fieldData.transformation) {
            transforms.push({
              id: `${dataset.name}_${fieldName}_transform`,
              name: `${fieldName} transform`,
              transformType: fieldData.transformationType || 'TRANSFORM',
              transform: fieldData.transformation,
              description: fieldData.transformationDescription,
              inputFields: fieldData.inputFields || [],
              outputField: fieldName,
              dataset: dataset.name,
              // Add SQL and other code fields if they exist
              sql: fieldData.sql,
              pythonCode: fieldData.pythonCode,
              sparkCode: fieldData.sparkCode,
              sourceCode: fieldData.sourceCode,
              sourceFile: fieldData.sourceFile,
              language: fieldData.language
            });
          }
        });
      }
    });

    // Add DBT-based transformations (simulated data for demonstration)
    // In a real implementation, this would extract from actual DBT files
    const dbtTransforms: ColumnTransform[] = [
      {
        id: 'dbt_customer_aggregation_customer_id',
        name: 'customer_id transform',
        transformType: 'DBT_TRANSFORM',
        transform: 'customer_id',
        description: 'dbt transform in customer_aggregation',
        inputFields: [{ namespace: 'data_pipeline', name: 'raw_customers', field: 'id' }],
        outputField: 'customer_id',
        dataset: 'customer_aggregation',
        sql: 'SELECT id as customer_id FROM raw_customers',
        language: 'dbt',
        sourceFile: 'models/marts/customer_aggregation.sql'
      },
      {
        id: 'dbt_customer_aggregation_total_orders',
        name: 'total_orders transform',
        transformType: 'DBT_TRANSFORM',
        transform: 'COUNT(orders.id) as total_orders',
        description: 'dbt transform in customer_aggregation',
        inputFields: [{ namespace: 'data_pipeline', name: 'raw_orders', field: 'id' }],
        outputField: 'total_orders',
        dataset: 'customer_aggregation',
        sql: 'SELECT COUNT(orders.id) as total_orders FROM raw_orders orders',
        language: 'dbt',
        sourceFile: 'models/marts/customer_aggregation.sql'
      },
      {
        id: 'dbt_customer_aggregation_avg_order_value',
        name: 'avg_order_value transform',
        transformType: 'DBT_TRANSFORM',
        transform: 'AVG(orders.amount) as avg_order_value',
        description: 'dbt transform in customer_aggregation',
        inputFields: [{ namespace: 'data_pipeline', name: 'raw_orders', field: 'amount' }],
        outputField: 'avg_order_value',
        dataset: 'customer_aggregation',
        sql: 'SELECT AVG(orders.amount) as avg_order_value FROM raw_orders orders',
        language: 'dbt',
        sourceFile: 'models/marts/customer_aggregation.sql'
      },
      {
        id: 'dbt_data_transformer_processed_amount',
        name: 'processed_amount transform',
        transformType: 'DBT_TRANSFORM',
        transform: 'ROUND(amount * 1.1, 2) as processed_amount',
        description: 'dbt transform in data_transformer',
        inputFields: [{ namespace: 'data_pipeline', name: 'raw_transactions', field: 'amount' }],
        outputField: 'processed_amount',
        dataset: 'processed_data',
        sql: 'SELECT ROUND(amount * 1.1, 2) as processed_amount FROM raw_transactions',
        language: 'dbt',
        sourceFile: 'models/staging/data_transformer.sql'
      },
      {
        id: 'dbt_data_transformer_category',
        name: 'category transform',
        transformType: 'DBT_TRANSFORM',
        transform: 'UPPER(category) as category',
        description: 'dbt transform in data_transformer',
        inputFields: [{ namespace: 'data_pipeline', name: 'raw_transactions', field: 'category' }],
        outputField: 'category',
        dataset: 'processed_data',
        sql: 'SELECT UPPER(category) as category FROM raw_transactions',
        language: 'dbt',
        sourceFile: 'models/staging/data_transformer.sql'
      }
    ];

    // Add DBT transforms to the main transforms array
    transforms.push(...dbtTransforms);
    console.log('🔧 Added DBT transforms:', dbtTransforms.length);

    // Add job nodes with their associated transforms
    jobs.forEach((job, index) => {
      // Find transforms for this job (transforms that belong to this job's output datasets)
      const jobTransforms = transforms.filter(transform => 
        job.outputs.some(output => transform.dataset === output)
      );
      
      // Add transforms to the job
      const jobWithTransforms = {
        ...job,
        transforms: jobTransforms
      };
      
      nodes.push({
        id: job.id,
        type: 'lineageNode',
        data: {
          type: 'job',
          data: jobWithTransforms,
        },
        position: { x: index * 300, y: 300 },
        draggable: true,
      });
    });

    // Don't create individual transform nodes - they'll be shown within job nodes instead
    console.log('🔧 Transforms will be shown within job nodes:', transforms.length);

    // Create table-level edges
    jobs.forEach(job => {
      job.inputs.forEach(input => {
        const inputDataset = datasets.find(d => d.name === input);
        if (inputDataset) {
                 edges.push({
                   id: `${inputDataset.id}-${job.id}`,
                   source: inputDataset.id,
                   target: job.id,
                   type: 'default',
                 });
        }
      });

      job.outputs.forEach(output => {
        const outputDataset = datasets.find(d => d.name === output);
        if (outputDataset) {
                 edges.push({
                   id: `${job.id}-${outputDataset.id}`,
                   source: job.id,
                   target: outputDataset.id,
                   type: 'default',
                 });
        }
      });
    });

    // Don't create column-level edges - transforms are shown within job hovers instead

    // No transform-to-dataset edges needed since transforms are shown within job nodes

    console.log('🎯 Final graph:', { nodes: nodes.length, edges: edges.length, transforms: transforms.length });
    console.log('📋 Node IDs:', nodes.map(n => n.id));
    console.log('🔗 Edge IDs:', edges.map(e => `${e.source} -> ${e.target}`));
    console.log('🔧 Transform nodes:', nodes.filter(n => n.data.type === 'transform').map(n => n.id));

    return { nodes, edges, jobs, datasets, transforms };
  }

  async traceColumnLineage(columnId: string): Promise<string[]> {
    // This would implement column-level tracing logic
    // For now, return a simple path
    return [columnId];
  }
}

export const marquezApi = new MarquezApiService();

// Debug: Check if marquezApi is properly created
console.log('🔧 MarquezApiService created:', marquezApi);
