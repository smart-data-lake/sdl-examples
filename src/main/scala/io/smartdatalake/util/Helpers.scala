package io.smartdatalake.util

import io.smartdatalake.app.SmartDataLakeBuilderConfig
import io.smartdatalake.config.InstanceRegistry
import io.smartdatalake.workflow.{ActionPipelineContext, ExecutionPhase}

object Helpers {
  // TODO: unfortunately ActionPipelineContext is only accessible within io.smartdatalke. This will be fixed in a future version
  def getDefaultExecContext(registry: InstanceRegistry): ActionPipelineContext = ActionPipelineContext("test", "sandbox", 1, 1, registry, appConfig = SmartDataLakeBuilderConfig(), phase = ExecutionPhase.Exec)
}
