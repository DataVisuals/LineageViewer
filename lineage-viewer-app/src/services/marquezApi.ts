import axios from 'axios';
import { Dataset, Job, LineageGraph, LineageNode, LineageEdge } from '../types/lineage';

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
          inputs: ['attributes', 'raw_customers', 'raw_orders', 'raw_transactions'],
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
            
            const columns: any[] = [];

            return {
              id: `${dataset.namespace}.${dataset.name}`,
              name: dataset.name,
              namespace: dataset.namespace,
              type: dataset.type,
              columns,
              description: dataset.description || details.description,
              tags: dataset.tags || [],
              fields: details.facets?.schema?.fields || dataset.fields || [],
              facets: details.facets, // Add this line to store the facets data
            };
          } catch (error) {
            console.error(`Error fetching dataset details for ${dataset.name}:`, error);
            return {
              id: `${dataset.namespace}.${dataset.name}`,
              name: dataset.name,
              namespace: dataset.namespace,
              type: dataset.type,
              columns: [] as any[],
              description: dataset.description,
              tags: dataset.tags || [],
              fields: dataset.fields || [],
              facets: dataset.facets || {}, // Add this line to store the facets data
            };
          }
        })
      );

      console.log('📊 Processed datasets:', detailedDatasets.length);
      
      // Add DBT datasets to the datasets array
      const dbtDatasets = [
        // Raw datasets
        {
          id: 'data_pipeline.attributes',
          name: 'attributes',
          namespace: 'data_pipeline',
          type: 'raw_table',
          columns: [],
          description: 'Raw attributes dataset',
          tags: ['raw', 'source'],
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'value', type: 'string' }
          ],
          facets: {
            source: {
              type: 'database',
              name: 'source_db'
            }
          }
        },
        {
          id: 'data_pipeline.raw_customers',
          name: 'raw_customers',
          namespace: 'data_pipeline',
          type: 'raw_table',
          columns: [],
          description: 'Raw customers dataset',
          tags: ['raw', 'source'],
          fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string' }
          ],
          facets: {
            source: {
              type: 'database',
              name: 'source_db'
            }
          }
        },
        {
          id: 'data_pipeline.raw_orders',
          name: 'raw_orders',
          namespace: 'data_pipeline',
          type: 'raw_table',
          columns: [],
          description: 'Raw orders dataset',
          tags: ['raw', 'source'],
          fields: [
            { name: 'id', type: 'string' },
            { name: 'customer_id', type: 'string' },
            { name: 'amount', type: 'decimal' },
            { name: 'date', type: 'date' }
          ],
          facets: {
            source: {
              type: 'database',
              name: 'source_db'
            }
          }
        },
        {
          id: 'data_pipeline.raw_transactions',
          name: 'raw_transactions',
          namespace: 'data_pipeline',
          type: 'raw_table',
          columns: [],
          description: 'Raw transactions dataset',
          tags: ['raw', 'source'],
          fields: [
            { name: 'id', type: 'string' },
            { name: 'amount', type: 'decimal' },
            { name: 'category', type: 'string' },
            { name: 'date', type: 'date' }
          ],
          facets: {
            source: {
              type: 'database',
              name: 'source_db'
            }
          }
        },
        // Processed datasets
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

    // Extract all transforms from datasets (columns with transform data)
    const transforms: any[] = [];
    datasets.forEach(dataset => {
      if (dataset.columns && dataset.columns.length > 0) {
        dataset.columns.forEach((column: any) => {
          if (column.transformType || column.transform) {
            transforms.push({
              id: column.id || `${dataset.id}.${column.name}`,
              name: column.name,
              transformType: column.transformType || 'unknown',
              transform: column.transform,
              description: column.description,
              inputFields: column.inputFields || [],
              datasetId: dataset.id,
              datasetName: dataset.name,
              // Find the job that produces this dataset
              jobId: jobs.find(job => job.outputs.includes(dataset.name))?.id || 'unknown',
              jobName: jobs.find(job => job.outputs.includes(dataset.name))?.name || 'unknown',
            });
          }
        });
      }
    });

    // Add job nodes
    jobs.forEach((job, index) => {
      // Find transforms for this job
      const jobTransforms = transforms.filter(transform => transform.jobId === job.id);
      
      nodes.push({
        id: job.id,
        type: 'lineageNode',
        data: {
          type: 'job',
          data: {
            ...job,
            transforms: jobTransforms, // Add transforms to job data
          },
        },
        position: { x: index * 300, y: 300 },
        draggable: true,
      });
    });

    // Don't create transform nodes - show them in job tooltips instead

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

    // Don't create transform edges - transforms shown in job tooltips

    console.log('🎯 Final graph:', { nodes: nodes.length, edges: edges.length, transforms: transforms.length });
    console.log('📋 Node IDs:', nodes.map(n => n.id));
    console.log('🔗 Edge IDs:', edges.map(e => `${e.source} -> ${e.target}`));
    console.log('🔧 Transform nodes:', nodes.filter(n => n.data.type === 'transform').map(n => n.id));

    return { nodes, edges, jobs, datasets, transforms };
  }

}

export const marquezApi = new MarquezApiService();

// Debug: Check if marquezApi is properly created
console.log('🔧 MarquezApiService created:', marquezApi);
