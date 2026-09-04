package com.sample

import com.typesafe.config.Config
import io.smartdatalake.config.SdlConfigObject.DataObjectId
import io.smartdatalake.config.{FromConfigFactory, InstanceRegistry}
import io.smartdatalake.util.hdfs.PartitionValues
import io.smartdatalake.util.misc.CustomCodeUtil
import io.smartdatalake.workflow.ActionPipelineContext
import io.smartdatalake.workflow.dataframe.spark.SparkSubFeed
import io.smartdatalake.workflow.dataobject.spark.CanCreateSparkDataFrame
import io.smartdatalake.workflow.dataobject.{DataObject, DataObjectMetadata}
import org.apache.spark.sql.{DataFrame, SparkSession}

/**
 * A [[DataObject]] which creates its DataFrame from custom Scala code, replacing SDLBs
 * CustomRatingDataObject which was removed in 3.0.0. Reference it in the configuration by its fully
 * qualified class name:
 *
 * {{{
 * custom-my-df {
 *   type = com.sample.CustomRatingDataObject
 * }
 * }}}
 */
case class CustomRatingDataObject(
    override val id: DataObjectId,
    override val metadata: Option[DataObjectMetadata] = None
)(@transient implicit val instanceRegistry: InstanceRegistry)
    extends DataObject with CanCreateSparkDataFrame {

  override def getSparkDataFrame(partitionValues: Seq[PartitionValues] = Seq())(implicit context: ActionPipelineContext): DataFrame = {
    val session = SparkSubFeed.getSparkSession
    import session.implicits._
    val rows = Seq(("müller", "hans", 5))
    rows.toDF("lastname", "firstname", "rating")
  }
}

object CustomRatingDataObject extends FromConfigFactory[DataObject] {
  override def fromConfig(config: Config)(implicit instanceRegistry: InstanceRegistry): CustomRatingDataObject =
    extract[CustomRatingDataObject](config)
}
