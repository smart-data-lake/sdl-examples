package com.sample

import io.smartdatalake.workflow.action.spark.customlogic.CustomDfsTransformer
import org.apache.spark.sql.functions.sum
import org.apache.spark.sql.{DataFrame, SparkSession}

class RatingTransformer extends CustomDfsTransformer {
  override def transform(session: SparkSession, options: Map[String, String], dfs: Map[String,DataFrame]): Map[String,DataFrame] = {
    import session.implicits._
    val df_transformed = dfs("custom-rating-csv1")
      .union(dfs("custom-rating-csv2"))
      .groupBy($"lastname",$"firstname")
      .agg(sum($"rating").as("rating"))
      .coalesce(1)

    Map("custom-rating-csv-agg" -> df_transformed)
  }
}