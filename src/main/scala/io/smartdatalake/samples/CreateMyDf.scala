package io.smartdatalake.samples

import io.smartdatalake.workflow.action.customlogic.CustomDfCreator
import org.apache.spark.sql.{DataFrame, SparkSession}
import org.slf4j.LoggerFactory

class CreateMyDf extends CustomDfCreator {
  private val logger = LoggerFactory.getLogger(this.getClass)

  def exec(session: SparkSession, config: Map[String, String]): DataFrame = {
    import session.implicits._

    logger.info(s"********* START CreateMyDf.exec *********")
    logger.info(s"exec: config = $config")
    val rows: Seq[(Int, String)] = Seq((0,"Welcome!"),(1,"I am your custom data frame."),(2,"I wish you a happy day."),(3,"Bye"))
    val myDf: DataFrame = rows.toDF("line","text")
    myDf.show(false)
    logger.info(s"exec: myDf = $myDf")
    logger.info(s"exec: myDf.count = ${myDf.count}")
    myDf
  }
}
