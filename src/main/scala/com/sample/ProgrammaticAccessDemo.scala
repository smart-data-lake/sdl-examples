package com.sample

import io.smartdatalake.config.SdlConfigObject.stringToDataObjectId
import io.smartdatalake.config.ConfigToolbox
import io.smartdatalake.testutils.TestUtil
import io.smartdatalake.workflow.ActionPipelineContext
import io.smartdatalake.workflow.dataobject.{CsvFileDataObject, ParquetFileDataObject}
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions._

object ProgrammaticAccessDemo extends App {

  // get config objects
  val (registry, globalConfig) = ConfigToolbox.loadAndParseConfig(Seq("../src/main/resources"))

  // create spark session if not provided by environment
  implicit val session: SparkSession = globalConfig.sparkSession("test", Some("local[*]"))
  implicit val context: ActionPipelineContext = ConfigToolbox.getDefaultActionPipelineContext(session, registry)
  import session.implicits._

  // get data object of the registry
  val dataObject = registry.get[CsvFileDataObject]("ab-csv-org")

  // print schema and content
  val df = dataObject.getSparkDataFrame()
  df.printSchema
  df.show

}
