package com.sample

import io.smartdatalake.workflow.action.spark.customlogic.CustomDfCreator
import org.apache.spark.sql.{DataFrame, SparkSession}

class CreateRatingDf extends CustomDfCreator {
  def exec(session: SparkSession, config: Map[String,String]): DataFrame = {
    import session.implicits._
    Seq(("müller","hans",5)).toDF("lastname", "firstname", "rating")
  }
}
