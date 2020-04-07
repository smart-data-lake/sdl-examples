package com.test

import io.smartdatalake.config.ConfigToolbox
import io.smartdatalake.workflow.dataobject.CsvFileDataObject
import io.smartdatalake.config.SdlConfigObject.stringToDataObjectId

object ProgrammaticAccessDemo extends App {

  // get config objects
  val (registry, globalConfig) = ConfigToolbox.loadAndParseConfig(Seq("../src/main/resources"))

  // create spark session if not provided by environment
  implicit val session = globalConfig.createSparkSession("test")

  // get data object of the registry
  val dataObject = registry.get[CsvFileDataObject]("ab-csv-org")

  // print schema and content
  val df = dataObject.getDataFrame()
  df.printSchema
  df.show

}
