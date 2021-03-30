package com.sample

import io.smartdatalake.workflow.action.customlogic.CustomDfTransformer
import org.apache.spark.sql.{DataFrame, SparkSession}

class ReduceNycCSVTransformer extends CustomDfTransformer {
  override def transform(session: SparkSession, options: Map[String,String], df: DataFrame, dataObjectId: String) : DataFrame = {
    import session.implicits._
    df.select($"id".cast("int"), $"name")
  }
}
