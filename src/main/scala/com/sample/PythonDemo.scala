package com.sample

import java.io.FileNotFoundException

import io.smartdatalake.config.ConfigToolbox
import org.apache.spark.python.PythonHelper
import org.apache.spark.python.PythonHelper.SparkEntryPoint
import org.apache.spark.sql.{DataFrame, SparkSession}

import scala.io.Source

object PythonDemo extends App {

  // get config objects
  val (registry, globalConfig) = ConfigToolbox.loadAndParseConfig(Seq("../src/main/resources"))

  // create spark session if not provided by environment
  implicit val session: SparkSession = globalConfig.createSparkSession("pythonTest", Some("local[*]"))
  import session.implicits._

  val df1 = session.sparkContext.parallelize(Seq((1,2,3), (2,3,4))).toDF("a", "b", "c")
  val entryPoint = new DfTransformerSparkEntryPoint(session, df1)
  execPythonTransform( entryPoint, """
      |df2 = inputDf.withColumn("test", lit("test"))
      |setOutputDf(df2)
      |""".stripMargin)

  // print schema and content
  //val df = session.table("pyspark_test")
  val df = entryPoint.outputDf.getOrElse(throw new IllegalStateException("Python transformation must set output DataFrame"))
  df.printSchema
  df.show

  /**
   * Execute python code within a given Spark context/session.
   *
   * @param pythonCode python code as string.
   *                   The SparkContext is available as "sc" and SparkSession as "session".
   * @param entryPointObj py4j gateway entrypoint java object available in python code as gateway.entry_point.
   *                      This is used to transfer SparkContext to python and can hold additional custom parameters.
   *                      entryPointObj must at least implement trait SparkEntryPoint.
   */
  def execPythonTransform[T<:SparkEntryPoint](entryPointObj: T, pythonCode: String): Unit = {

    // load python spark init code
    val pythonSparkInitResource = "pythonSparkInit.py"
    val initCodeIS = Option(getClass.getClassLoader.getResourceAsStream(pythonSparkInitResource))
      .getOrElse(throw new FileNotFoundException(pythonSparkInitResource))
    val initCode = Source.fromInputStream(initCodeIS).mkString

    // exec
    PythonHelper.exec(entryPointObj, initCode + "\n" + pythonCode)
  }

}

case class DfTransformerSparkEntryPoint(override val session: SparkSession, inputDf: DataFrame, options: Map[String,String] = Map(), var outputDf: Option[DataFrame] = None) extends SparkEntryPoint {
  def getInputDf: DataFrame = inputDf
  def setOutputDf(df: DataFrame): Unit = {
    outputDf = Some(df)
  }
}
