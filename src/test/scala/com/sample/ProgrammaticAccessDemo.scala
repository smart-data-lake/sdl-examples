package com.sample

import io.smartdatalake.config.SdlConfigObject.stringToDataObjectId
import io.smartdatalake.config.ConfigToolbox
import io.smartdatalake.workflow.ActionPipelineContext
import io.smartdatalake.workflow.dataframe.spark.SparkSubFeed
import io.smartdatalake.workflow.dataobject.CsvFileDataObject
import org.apache.spark.sql.SparkSession

object ProgrammaticAccessDemo extends App {

  // get config objects
  val (registry, globalConfig) = ConfigToolbox.loadAndParseConfig(Seq("../config", "../envConfig/dev.conf"))

  implicit val context: ActionPipelineContext = ConfigToolbox.getDefaultActionPipelineContext(registry)

  // since SDLB 3.0.0 the spark session comes from the "default-engine" SparkClassicConnection
  // defined in config/global.conf
  implicit val session: SparkSession = SparkSubFeed.getSparkSession
  import session.implicits._

  // get data object of the registry
  val dataObject = registry.get[CsvFileDataObject]("ab-csv-org")

  // print schema and content
  val df = dataObject.getSparkDataFrame()
  df.printSchema
  df.show

}
