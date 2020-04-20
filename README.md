# Smart Data Lake Examples

## Examples
Currently implemented example feeds (the name is used to substitute `<example>` - see below) in `samples.conf`:
- custom-my-df2csv: Write a custom DataFrame to CSV
- ab-csv: Read file from CSV and write contents to CSV.
- ab-parquet-hive: Read file from CSV, write contents to Parquet, then write contents to Hive in a second Action.
- ab-excel: Read file from CSV and write contents to Excel file.
- ab-jdbc: Read file from CSV, reduce columns with custom transformation and write contents to JDBC. In a second Action read data from JDBC and write it back to CSV.
- custom-rating-csv: Write a custom DataFrame to two different CSV files. Then read both CSV files in a CustomSparkAction with aggregation logic.

The following reporting feeds which work with the metadata of the example feeds in `reporting.conf`:
- export-metadata: Writes metadata of DataObjects and Actions to CSV
- check-constraints: Writes PK violations for tables with primary key defined to CSV

## Run with Maven
1. Set the following environment variable: `HADOOP_HOME=/path/to/hadoop` (see https://github.com/smart-data-lake/smart-data-lake).
1. Build the io.smartdatalake:smartdatalake (the main project): `mvn -DskipTests clean install`
1. Change to the examples project (io.smartdatalake:sdl-examples).
1. Execute all examples: `mvn clean verify`

Note: To execute a single example: 
```
 mvn clean package exec:exec -Dexec.executable="java" -Dexec.args="-classpath %classpath io.smartdatalake.app.workflow.DefaultSmartDataLakeBuilder --feed-sel <regex-pattern> --name <app-name>" -Dexec.workingdir="target"
```
(requires Maven 3.3.1 or later)


## Run Example (IntelliJ on Windows)
1. Ensure, that the directory `src/main/resources` is configured as a resource directory in IntelliJ (File - Project Structure - Modules). 

   It contains the `global.conf`, `samples.conf` and `reports.conf` configuration files that defines the example feeds.
    
1. Configure and run the following run configuration in IntelliJ IDEA:
    - Main class: `io.smartdatalake.app.workflow.DefaultSmartDataLakeBuilder`
    - Program arguments: `--feed-sel <regex-feedname-selector> --config $ProjectFileDir$/src/main/resources`
    - Working directory: `/path/to/sdl-examples/target`
    - Environment variables: 
        - `HADOOP_HOME=/path/to/hadoop` (see https://github.com/smart-data-lake/smart-data-lake)

## Programmatic Access to Data Objects (e.g. Notebooks)
To programmatically access DataObjects for testing the config or interactive exploration in Notebooks, see [ProgrammaticAccessDemo](src/main/scala/com/sample/ProgrammaticAccessDemo.scala)

## Lineage Visualization
- download & install npm: [get-npm](https://www.npmjs.com/get-npm)
- install npm package "http-server": `npm install http-server -g`
- Execute all examples: `mvn clean verify`
  (some of them are exporting the metadata csv-files which are input for the lineage graph) 
- change to project dir and start "http-server": `npx http-server -c-1 -o src/main/viz/lineage.html`
