package com.sample

import io.smartdatalake.config.ConfigToolbox
import io.smartdatalake.config.SdlConfigObject.stringToDataObjectId
import io.smartdatalake.util.Helpers
import io.smartdatalake.workflow.dataobject.CsvFileDataObject
import org.apache.spark.sql.SparkSession

object ProgrammaticAccessDemo extends App {

  // get config objects
  val (registry, globalConfig) = ConfigToolbox.loadAndParseConfig(Seq("../src/main/resources"))

  // create spark session if not provided by environment
  implicit val session: SparkSession = globalConfig.createSparkSession("test", Some("local[*]"))
  implicit val context = Helpers.getDefaultExecContext(registry)

  // get data object of the registry
  val dataObject = registry.get[CsvFileDataObject]("ab-csv-org")

  // print schema and content
  val df = dataObject.getDataFrame()
  df.printSchema
  df.show

}
