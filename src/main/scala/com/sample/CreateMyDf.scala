package com.sample

import io.smartdatalake.workflow.action.spark.customlogic.CustomDfCreator
import org.apache.spark.sql.{DataFrame, SparkSession}

class CreateMyDf extends CustomDfCreator  {
  def exec(session: SparkSession, config: Map[String, String]): DataFrame = {
    import session.implicits._
    val rows: Seq[(Int, String)] = Seq((0,"Welcome!"),(1,"I am your custom data frame."),(2,"I wish you a happy day."),(3,"Bye"))
    rows.toDF("line","text")
  }
}
