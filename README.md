# Smart Data Lake Examples

## Examples
Currently implemented example feeds (the name is used to substitute `<example>` - see below) in `samples.conf`:
- custom-my-df2csv: Write a custom DataFrame to CSV
- ab-csv: Read file from CSV and write contents to CSV.
- ab-parquet-hive: Read file from CSV, write contents to Parquet, then write contents to Hive in a second Action.
- ab-excel: Read file from CSV and write contents to Excel file.
- ab-jdbc: Read file from CSV, reduce columns with custom transformation and write contents to JDBC. In a second Action read data from JDBC and write it back to CSV.
- ab-sql-transform: Read file from CSV and transform one input/output with SQL statement.
- ab-sql-multi-transform: Read file from CSV and transform one input to multiple outputs with SQL statement.
- ab-python-transform: Read file from CSV and transform with python pyspark code. This is commented out by default. See notes below for setting up python environment. 
- custom-rating-csv: Write a custom DataFrame to two different CSV files. Then read both CSV files in a CustomSparkAction with aggregation logic.

The following reporting feeds which work with the metadata of the example feeds in `reporting.conf`:
- export-metadata: Writes metadata of DataObjects and Actions to CSV
- check-constraints: Writes PK violations for tables with primary key defined to CSV

## Run with Maven
1. Set the following environment variable: `HADOOP_HOME=/path/to/hadoop` (see https://github.com/smart-data-lake/smart-data-lake).
1. Change to the examples project (io.smartdatalake:sdl-examples).
1. Execute all examples: `mvn clean verify`

Note: To execute a single example: 
```
 mvn clean package exec:exec -Dexec.executable="java" -Dexec.args="-classpath %classpath io.smartdatalake.app.LocalSmartDataLakeBuilder --feed-sel <regex-pattern> --config <path-to-projectdir>/src/main/resources" -Dexec.workingdir="target"
```
(requires Maven 3.3.1 or later)


## Run Example (IntelliJ on Windows)
1. Ensure, that the directory `src/main/resources` is configured as a resource directory in IntelliJ (File - Project Structure - Modules). 

   It contains the `global.conf`, `samples.conf` and `reports.conf` configuration files that defines the example feeds.
    
1. Configure and run the following run configuration in IntelliJ IDEA:
    - Main class: `io.smartdatalake.app.LocalSmartDataLakeBuilder`
    - Program arguments: `--feed-sel <regex-feedname-selector> --config $ProjectFileDir$/src/main/resources`
    - Working directory: `/path/to/sdl-examples/target` or just `target`
    - Environment variables: 
        - `HADOOP_HOME=/path/to/hadoop` (see https://github.com/smart-data-lake/smart-data-lake)

## Programmatic Access to Data Objects (e.g. Notebooks)
To programmatically access DataObjects for testing the config or interactive exploration in Notebooks, see [ProgrammaticAccessDemo](src/main/scala/com/sample/ProgrammaticAccessDemo.scala)

## Run Python PySpark example feed
To run feed ab-python-transform you need to install Python and PySpark.
In IntelliJ this can be achieved by the following steps:
1. Download and install python version 3.7. Note that version 3.8 only works from spark 3.0 (SPARK-29536).
1. Install IntelliJ Python plugin.
1. Configure additional Python SDK as "Virtualenv Environment" in "Project Structure". Install to directory <projectdir>/venv.
1. Configure additional Module "Python Interpreter" module in "Project Structure".
1. Open requirements.txt in project root dir. IntelliJ should now download and install python packages to virtualenv.
1. Make sure your "Run Configuration" has set environment variable "PYTHONPATH" to "<projectdir>/venv/Lib/site-packages" (assuming virtualenv is installed to <projectdir>/venv).
1. Make sure your "Run Configuration" has extended environment variable "PATH" to "<projectdir>/venv/Scripts;$PATH$" in order to use the right Python binary version. 
1. Rename src/main/resources/python_samples.conf.disable -> python_samples.conf

Now you should be able to run feed `ab-python-.*`.
Note that if there are problems with the python transform there is an PythonTransformationException thrown, but the real python execution error is written some lines above in the logs/stdout.

Troubleshooting:
- "Cannot run program "python3": CreateProcess error=2, The system cannot find the file specified;"
  - Set environment variable "PYSPARK_PYTHON=python" in run configuration