# Smart Data Lake Examples

## Examples
Currently implemented example feeds (the name is used to substitute `<example>` - see below) in `samples.conf`:
- custom-my-df2csv: Write a custom DataFrame to CSV
- ab-csv: Read file from CSV and write contents to CSV.
- ab-parquet: Read file from CSV and write contents to Parquet.
- ab-excel: Read file from CSV and write contents to Excel file.
- ab-jdbc: Read file from CSV, reduce columns with custom transformation and write contents to JDBC. In a second Action read data from JDBC and write it back to CSV.
- ab-sql-transform: Read file from CSV and transform one input/output with SQL statement.
- ab-sql-multi-transform: Read file from CSV and transform one input to multiple outputs with SQL statement.
- ab-python-transform: Read file from CSV and transform with python pyspark code. This is commented out by default. See notes below for setting up python environment. 
- custom-rating-csv: Write a custom DataFrame to two different CSV files. Then read both CSV files in a CustomSparkAction with aggregation logic.

The following reporting feeds which work with the metadata of the example feeds in `reports.conf`:
- export-metadata: Writes metadata of DataObjects and Actions to CSV
- check-constraints: Writes PK violations for tables with primary key defined to CSV

## Requirements
Java 17 is required (SDLB 3.x builds on Spark 4.1).
The examples build against `io.smartdatalake:sdl-parent:3.0.0-SNAPSHOT` from
https://central.sonatype.com/repository/maven-snapshots/.

## Run with Maven
1. Set the following environment variable: `HADOOP_HOME=/path/to/hadoop` (see https://github.com/smart-data-lake/smart-data-lake).
1. Change to the examples project (io.smartdatalake:sdl-examples).
1. Execute all examples: `mvn clean verify`

Note: To execute a single example: 
```
 mvn clean package exec:exec -Dexec.executable="java" -Dexec.args="$JAVA_OPTIONS -classpath %classpath io.smartdatalake.app.DefaultSmartDataLakeBuilder --feed-sel <regex-pattern> --config <path-to-projectdir>/config,<path-to-projectdir>/envConfig/dev.conf" -Dexec.workingdir="target"
```
(requires Maven 3.3.1 or later)

`$JAVA_OPTIONS` must contain the module opens Spark needs on Java 17 when started as a plain java
process (the `mvn clean verify` run above passes them for you, see the exec plugin in `pom.xml`):
```
--add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/jdk.internal.ref=ALL-UNNAMED --add-opens=java.base/sun.nio.cs=ALL-UNNAMED --add-opens=java.base/sun.security.action=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED
```

Since SDLB 3.0.0 the Spark session is no longer configured by the main class: `DefaultSmartDataLakeBuilder`
replaces `LocalSmartDataLakeBuilder`, and the Spark master and options come from the `default-engine`
`SparkClassicConnection` defined in `config/global.conf`.


## Run Example (IntelliJ on Windows)
The `global.conf`, `samples.conf` and `reports.conf` files defining the example feeds live in `config/`,
the environment configuration in `envConfig/dev.conf`.

1. Configure and run the following run configuration in IntelliJ IDEA (see also the shipped
   `SmartDataLakeBuilder` run configuration):
    - Main class: `io.smartdatalake.app.DefaultSmartDataLakeBuilder`
    - Program arguments: `--feed-sel <regex-feedname-selector> --config $ProjectFileDir$/config/,$ProjectFileDir$/envConfig/dev.conf`
    - VM options: `-Dio.netty.tryReflectionSetAccessible=true` plus the `--add-opens` list above
    - Working directory: `/path/to/sdl-examples/target` or just `target`
    - Environment variables: 
        - `HADOOP_HOME=/path/to/hadoop` (see https://github.com/smart-data-lake/smart-data-lake)

## Programmatic Access to Data Objects (e.g. Notebooks)
To programmatically access DataObjects for testing the config or interactive exploration in Notebooks, see [ProgrammaticAccessDemo](src/test/scala/com/sample/ProgrammaticAccessDemo.scala)

## Run Python PySpark example feed
To run feed ab-python-transform you need to install Python and PySpark.
In IntelliJ this can be achieved by the following steps:
1. Download and install a Python version supported by the PySpark release pinned in `requirements.txt` (Spark 4.1 needs Python 3.9 or later).
1. Install IntelliJ Python plugin.
1. Configure additional Python SDK as "Virtualenv Environment" in "Project Structure". Install to directory <projectdir>/venv.
1. Configure additional Module "Python Interpreter" module in "Project Structure".
1. Open requirements.txt in project root dir. IntelliJ should now download and install python packages to virtualenv.
1. Make sure your "Run Configuration" has set environment variable "PYTHONPATH" to "<projectdir>/venv/Lib/site-packages" (assuming virtualenv is installed to <projectdir>/venv).
1. Make sure your "Run Configuration" has extended environment variable "PATH" to "<projectdir>/venv/Scripts;$PATH$" in order to use the right Python binary version. 

Now you should be able to run feed ab-python-transform.
Note that if there are problems with the python transform there is an PythonTransformationException thrown, but the real python execution error is written some lines above in the logs/stdout.