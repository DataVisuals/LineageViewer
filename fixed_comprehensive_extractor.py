#!/usr/bin/env python3
"""
Fixed Comprehensive Transform Extractor
Extracts all transforms from dbt, Spark, Python, and SQL files with better parsing
"""

import os
import re
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd

class FixedComprehensiveExtractor:
    def __init__(self, lineage_dir: str):
        self.lineage_dir = Path(lineage_dir)
        self.transforms = []
        self.datasets = {}
        self.jobs = {}
        
    def extract_all_transforms(self) -> Dict[str, Any]:
        """Extract all transforms from all sources"""
        print("🔍 Extracting comprehensive transforms from all sources...")
        
        # Extract from different sources
        self._extract_dbt_transforms()
        self._extract_spark_transforms()
        self._extract_python_transforms()
        self._extract_sql_transforms()
        
        # Organize results
        result = {
            'extraction_timestamp': pd.Timestamp.now().isoformat(),
            'total_transforms': len(self.transforms),
            'transforms_by_type': self._group_transforms_by_type(),
            'transforms_by_language': self._group_transforms_by_language(),
            'datasets': self.datasets,
            'jobs': self.jobs,
            'all_transforms': self.transforms
        }
        
        return result
    
    def _extract_dbt_transforms(self):
        """Extract transforms from dbt models and schema files"""
        print("  🗄️ Extracting dbt transforms...")
        
        # Extract from dbt models
        models_dir = self.lineage_dir / "models"
        if models_dir.exists():
            for sql_file in models_dir.rglob("*.sql"):
                self._parse_dbt_sql_file(sql_file)
        
        # Extract from schema.yml
        schema_file = self.lineage_dir / "models" / "schema.yml"
        if schema_file.exists():
            self._parse_dbt_schema_file(schema_file)
    
    def _extract_spark_transforms(self):
        """Extract transforms from Spark Python files"""
        print("  ⚡ Extracting Spark transforms...")
        
        spark_files = [
            "spark_pipeline.py",
            "spark_pipeline_simple.py", 
            "test_spark_pipeline.py"
        ]
        
        for file_name in spark_files:
            file_path = self.lineage_dir / file_name
            if file_path.exists():
                self._parse_spark_file(file_path)
    
    def _extract_python_transforms(self):
        """Extract transforms from Python files"""
        print("  🐍 Extracting Python transforms...")
        
        python_files = [
            "data_transformer.py",
            "data_pipeline.py",
            "data_extractor.py",
            "data_generator.py",
            "database_manager.py"
        ]
        
        for file_name in python_files:
            file_path = self.lineage_dir / file_name
            if file_path.exists():
                self._parse_python_file(file_path)
    
    def _extract_sql_transforms(self):
        """Extract transforms from standalone SQL files"""
        print("  🗄️ Extracting SQL transforms...")
        
        # Look for SQL files outside of dbt models
        for sql_file in self.lineage_dir.rglob("*.sql"):
            if 'models' not in str(sql_file) and 'macros' not in str(sql_file):
                self._parse_sql_file(sql_file)
    
    def _parse_dbt_sql_file(self, file_path: Path):
        """Parse dbt SQL file for transforms"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Extract table name from file path
            table_name = file_path.stem
            layer = file_path.parent.name  # staging, marts, etc.
            
            # Find SELECT statements and extract column transformations
            # More flexible regex to handle various SQL patterns
            select_pattern = r'SELECT\s+(.*?)\s+FROM\s+(\w+)'
            matches = re.findall(select_pattern, content, re.DOTALL | re.IGNORECASE)
            
            if not matches:
                # Try alternative patterns
                select_pattern = r'select\s+(.*?)\s+from\s+(\w+)'
                matches = re.findall(select_pattern, content, re.DOTALL)
            
            for select_clause, from_table in matches:
                columns = self._parse_select_clause(select_clause)
                for col_name, transform in columns.items():
                    if transform != col_name:  # Only capture actual transformations
                        self.transforms.append({
                            'id': f"dbt_{table_name}_{col_name}",
                            'file': str(file_path.relative_to(self.lineage_dir)),
                            'language': 'dbt',
                            'layer': layer,
                            'table': table_name,
                            'column': col_name,
                            'transform_type': self._classify_transform(transform),
                            'transform': transform,
                            'input_table': from_table,
                            'description': f"dbt transform in {table_name}"
                        })
            
            # Store dataset info
            self.datasets[f"dbt_{table_name}"] = {
                'name': table_name,
                'type': 'dbt_model',
                'layer': layer,
                'file': str(file_path.relative_to(self.lineage_dir))
            }
            
        except Exception as e:
            print(f"    ⚠️ Error parsing {file_path}: {e}")
    
    def _parse_dbt_schema_file(self, file_path: Path):
        """Parse dbt schema.yml for tests and constraints"""
        try:
            with open(file_path, 'r') as f:
                schema_data = yaml.safe_load(f)
            
            if not isinstance(schema_data, dict):
                return
                
            for model_name, model_config in schema_data.get('models', {}).items():
                if not isinstance(model_config, dict):
                    continue
                    
                for column_name, column_config in model_config.get('columns', {}).items():
                    if not isinstance(column_config, dict):
                        continue
                        
                    # Extract tests
                    tests = column_config.get('tests', [])
                    if isinstance(tests, list):
                        for test in tests:
                            if isinstance(test, str):
                                test_name = test
                            elif isinstance(test, dict):
                                test_name = list(test.keys())[0]
                            else:
                                continue
                            
                            self.transforms.append({
                                'id': f"dbt_test_{model_name}_{column_name}_{test_name}",
                                'file': str(file_path.relative_to(self.lineage_dir)),
                                'language': 'dbt',
                                'layer': 'test',
                                'table': model_name,
                                'column': column_name,
                                'transform_type': 'dbt_test',
                                'transform': test_name,
                                'description': f"dbt test: {test_name} on {column_name}"
                            })
            
        except Exception as e:
            print(f"    ⚠️ Error parsing schema file {file_path}: {e}")
    
    def _parse_spark_file(self, file_path: Path):
        """Parse Spark Python file for transforms"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Extract PySpark operations
            spark_operations = [
                (r'\.filter\(([^)]+)\)', 'filter'),
                (r'\.select\(([^)]+)\)', 'select'),
                (r'\.groupBy\(([^)]+)\)', 'groupBy'),
                (r'\.agg\(([^)]+)\)', 'agg'),
                (r'\.withColumn\(([^)]+)\)', 'withColumn'),
                (r'\.drop\(([^)]+)\)', 'drop'),
                (r'\.fillna\(([^)]+)\)', 'fillna'),
                (r'\.replace\(([^)]+)\)', 'replace'),
                (r'\.join\(([^)]+)\)', 'join'),
                (r'\.orderBy\(([^)]+)\)', 'orderBy'),
                (r'\.distinct\(\)', 'distinct'),
                (r'\.coalesce\(([^)]+)\)', 'coalesce'),
                (r'\.repartition\(([^)]+)\)', 'repartition')
            ]
            
            for pattern, operation in spark_operations:
                matches = re.findall(pattern, content)
                for i, match in enumerate(matches):
                    self.transforms.append({
                        'id': f"spark_{file_path.stem}_{operation}_{i}",
                        'file': str(file_path.relative_to(self.lineage_dir)),
                        'language': 'spark',
                        'layer': 'processing',
                        'table': 'spark_dataframe',
                        'column': 'multiple',
                        'transform_type': 'spark_operation',
                        'transform': f"{operation}({match})",
                        'description': f"Spark {operation} operation"
                    })
            
            # Store job info
            self.jobs[f"spark_{file_path.stem}"] = {
                'name': file_path.stem,
                'type': 'spark_job',
                'file': str(file_path.relative_to(self.lineage_dir))
            }
            
        except Exception as e:
            print(f"    ⚠️ Error parsing Spark file {file_path}: {e}")
    
    def _parse_python_file(self, file_path: Path):
        """Parse Python file for pandas/numpy transforms"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Extract pandas operations
            pandas_operations = [
                (r'\.str\.(\w+)\([^)]*\)', 'string_operation'),
                (r'\.fillna\([^)]*\)', 'fillna'),
                (r'\.dropna\([^)]*\)', 'dropna'),
                (r'\.clip\([^)]*\)', 'clip'),
                (r'\.groupby\([^)]*\)', 'groupby'),
                (r'\.agg\([^)]*\)', 'agg'),
                (r'\.merge\([^)]*\)', 'merge'),
                (r'\.join\([^)]*\)', 'join'),
                (r'\.apply\([^)]*\)', 'apply'),
                (r'\.transform\([^)]*\)', 'transform'),
                (r'\.pivot\([^)]*\)', 'pivot'),
                (r'\.melt\([^)]*\)', 'melt'),
                (r'\.sort_values\([^)]*\)', 'sort_values'),
                (r'\.drop_duplicates\([^)]*\)', 'drop_duplicates')
            ]
            
            for pattern, operation in pandas_operations:
                matches = re.findall(pattern, content)
                for i, match in enumerate(matches):
                    self.transforms.append({
                        'id': f"python_{file_path.stem}_{operation}_{i}",
                        'file': str(file_path.relative_to(self.lineage_dir)),
                        'language': 'python',
                        'layer': 'processing',
                        'table': 'dataframe',
                        'column': 'multiple',
                        'transform_type': 'pandas_operation',
                        'transform': f"{operation}({match})",
                        'description': f"Python pandas {operation} operation"
                    })
            
            # Store job info
            self.jobs[f"python_{file_path.stem}"] = {
                'name': file_path.stem,
                'type': 'python_job',
                'file': str(file_path.relative_to(self.lineage_dir))
            }
            
        except Exception as e:
            print(f"    ⚠️ Error parsing Python file {file_path}: {e}")
    
    def _parse_sql_file(self, file_path: Path):
        """Parse standalone SQL file for transforms"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Extract SQL operations
            sql_operations = [
                (r'SELECT\s+(.*?)\s+FROM', 'select'),
                (r'WHERE\s+([^;]+)', 'where'),
                (r'GROUP BY\s+([^;]+)', 'group_by'),
                (r'ORDER BY\s+([^;]+)', 'order_by'),
                (r'HAVING\s+([^;]+)', 'having')
            ]
            
            for pattern, operation in sql_operations:
                matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
                for i, match in enumerate(matches):
                    self.transforms.append({
                        'id': f"sql_{file_path.stem}_{operation}_{i}",
                        'file': str(file_path.relative_to(self.lineage_dir)),
                        'language': 'sql',
                        'layer': 'query',
                        'table': 'sql_table',
                        'column': 'multiple',
                        'transform_type': 'sql_operation',
                        'transform': f"{operation}: {match}",
                        'description': f"SQL {operation} operation"
                    })
            
        except Exception as e:
            print(f"    ⚠️ Error parsing SQL file {file_path}: {e}")
    
    def _parse_select_clause(self, select_clause: str) -> Dict[str, str]:
        """Parse SELECT clause to extract column transformations"""
        columns = {}
        
        # Split by comma, but be careful with nested functions
        parts = []
        current_part = ""
        paren_count = 0
        
        for char in select_clause:
            if char == ',' and paren_count == 0:
                parts.append(current_part.strip())
                current_part = ""
            else:
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                current_part += char
        
        if current_part.strip():
            parts.append(current_part.strip())
        
        for part in parts:
            part = part.strip()
            if ' AS ' in part.upper():
                transform, alias = part.split(' AS ', 1)
                columns[alias.strip()] = transform.strip()
            elif ' as ' in part:
                transform, alias = part.split(' as ', 1)
                columns[alias.strip()] = transform.strip()
            else:
                # No alias, use the transform as the column name
                columns[part] = part
        
        return columns
    
    def _classify_transform(self, transform: str) -> str:
        """Classify the type of transformation"""
        transform_lower = transform.lower()
        
        if 'count(' in transform_lower or 'sum(' in transform_lower or 'avg(' in transform_lower:
            return 'aggregation'
        elif 'lower(' in transform_lower or 'upper(' in transform_lower:
            return 'string_function'
        elif 'regexp_replace(' in transform_lower or 'replace(' in transform_lower:
            return 'string_function'
        elif 'to_timestamp(' in transform_lower or 'cast(' in transform_lower:
            return 'type_conversion'
        elif 'group by' in transform_lower:
            return 'group_by'
        elif 'where' in transform_lower:
            return 'filter'
        else:
            return 'function'
    
    def _group_transforms_by_type(self) -> Dict[str, int]:
        """Group transforms by type"""
        type_counts = {}
        for transform in self.transforms:
            transform_type = transform['transform_type']
            type_counts[transform_type] = type_counts.get(transform_type, 0) + 1
        return type_counts
    
    def _group_transforms_by_language(self) -> Dict[str, int]:
        """Group transforms by language"""
        language_counts = {}
        for transform in self.transforms:
            language = transform['language']
            language_counts[language] = language_counts.get(language, 0) + 1
        return language_counts

def main():
    """Main function to extract all transforms"""
    lineage_dir = "/Users/andrewspruce/Lineage"
    
    print("🚀 Starting fixed comprehensive transform extraction...")
    
    extractor = FixedComprehensiveExtractor(lineage_dir)
    result = extractor.extract_all_transforms()
    
    # Save results
    output_file = "fixed_comprehensive_transforms.json"
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Extraction complete!")
    print(f"📊 Total transforms found: {result['total_transforms']}")
    print(f"📁 Results saved to: {output_file}")
    
    # Print summary
    print(f"\n📈 Transforms by type:")
    for transform_type, count in result['transforms_by_type'].items():
        print(f"  {transform_type}: {count}")
    
    print(f"\n🌐 Transforms by language:")
    for language, count in result['transforms_by_language'].items():
        print(f"  {language}: {count}")
    
    return result

if __name__ == "__main__":
    main()
