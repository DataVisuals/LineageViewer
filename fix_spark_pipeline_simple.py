#!/usr/bin/env python3
"""
Fix spark_pipeline_simple job to have proper Python code instead of just filename
"""

import requests
import json
import uuid
from datetime import datetime

# Marquez API configuration
MARQUEZ_API_URL = "http://localhost:3004/api/v1"
NAMESPACE = "data_pipeline"
JOB_NAME = "spark_pipeline_simple"

def fix_spark_pipeline_simple():
    """Fix the spark_pipeline_simple job with proper Python code"""
    print(f"🔧 Fixing {JOB_NAME} job with proper Python code...")
    
    # Generate proper Python code for spark_pipeline_simple
    python_code = '''from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, lit, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType
from datetime import datetime

def spark_pipeline_simple():
    """
    Spark Pipeline Simple - Simplified Spark data processing pipeline
    File: spark_pipeline_simple.py
    """
    print(f"Starting {spark_pipeline_simple.__name__} at {datetime.now()}")
    
    # Initialize Spark session
    spark = SparkSession.builder.appName("spark_pipeline_simple").getOrCreate()
    
    try:
        # Read input data
        df = spark.read.option("header", "true").csv("input_data.csv")
        print(f"Loaded {df.count()} rows from input_data.csv")
        
        # Simple transformations
        df_transformed = df.withColumn("processed_at", current_timestamp()) \\
                          .withColumn("status", lit("processed")) \\
                          .withColumn("pipeline_name", lit("spark_pipeline_simple"))
        
        # Add calculated fields if amount column exists
        if "amount" in df.columns:
            df_transformed = df_transformed.withColumn("amount_tax", col("amount") * 1.1)
            print("Added amount_tax calculation")
        
        # Show sample of transformed data
        print("Sample of transformed data:")
        df_transformed.show(5, truncate=False)
        
        # Write results
        df_transformed.write.mode("overwrite").csv("output_data")
        print(f"Wrote {df_transformed.count()} rows to output_data")
        
        return df_transformed
        
    except Exception as e:
        print(f"Error in spark_pipeline_simple: {e}")
        raise
    finally:
        spark.stop()
        print("Spark session stopped")

if __name__ == "__main__":
    result = spark_pipeline_simple()
    print("Spark pipeline simple completed successfully!")'''

    # Create OpenLineage event to update the job
    event_data = {
        "eventType": "COMPLETE",
        "eventTime": datetime.utcnow().isoformat() + "Z",
        "run": {
            "runId": str(uuid.uuid4()),
            "facets": {
                "nominalTime": {
                    "_producer": "https://github.com/OpenLineage/OpenLineage/tree/0.45.0/integration/common",
                    "_schemaURL": "https://raw.githubusercontent.com/OpenLineage/OpenLineage/main/spec/OpenLineage.json#/definitions/NominalTimeRunFacet",
                    "nominalStartTime": datetime.utcnow().isoformat() + "Z"
                }
            }
        },
        "job": {
            "namespace": NAMESPACE,
            "name": JOB_NAME,
            "facets": {
                "sourceCode": {
                    "source": python_code,
                    "language": "python",
                    "_producer": "https://github.com/OpenLineage/OpenLineage/tree/0.45.0/integration/common",
                    "_schemaURL": "https://raw.githubusercontent.com/OpenLineage/OpenLineage/main/spec/OpenLineage.json#/definitions/SourceCodeJobFacet"
                }
            }
        },
        "inputs": [
            {
                "namespace": NAMESPACE,
                "name": "raw_data",
                "facets": {}
            }
        ],
        "outputs": [
            {
                "namespace": NAMESPACE,
                "name": "spark_dataframe",
                "facets": {}
            }
        ],
        "producer": "https://github.com/OpenLineage/OpenLineage/tree/0.45.0/integration/common",
        "schemaURL": "https://raw.githubusercontent.com/OpenLineage/OpenLineage/main/spec/OpenLineage.json#/definitions/RunEvent"
    }
    
    # Send the event to Marquez
    response = requests.post(f"{MARQUEZ_API_URL}/lineage", json=event_data)
    
    if response.status_code in [200, 201]:
        print(f"✅ Successfully updated {JOB_NAME} with proper Python code")
        return True
    else:
        print(f"❌ Failed to update {JOB_NAME}: {response.status_code}: {response.text}")
        return False

if __name__ == "__main__":
    fix_spark_pipeline_simple()
