<script setup>
import { computed, toRef } from 'vue'
import { Handle, useHandleConnections } from '@vue-flow/core'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  sourcePosition: {
    type: String,
  },
  targetPosition: {
    type: String,
  },
})

const sourceConnections = useHandleConnections({
  type: 'target',
})

const targetConnections = useHandleConnections({
  type: 'source',
})

const isSender = toRef(() => sourceConnections.value.length <= 0)

const isReceiver = toRef(() => targetConnections.value.length <= 0)

const bgColor = computed(() => {
  if (isSender.value) {
    return '#2563eb'
  }

  if (props.data.hasError) {
    return '#f87171'
  }

  if (props.data.isFinished) {
    return '#42B983'
  }

  if (props.data.isCancelled) {
    return '#fbbf24'
  }

  return '#4b5563'
})

const processLabel = computed(() => {
  if (props.data.hasError) {
    return '❌'
  }

  if (props.data.isSkipped) {
    return '🚧'
  }

  if (props.data.isCancelled) {
    return '🚫'
  }

  if (isSender.value) {
    return '📦'
  }

  if (props.data.isFinished) {
    return '😎'
  }

  return '🏠'
})
</script>

<template>
  <div class="process-node" :style="{ backgroundColor: bgColor, boxShadow: data.isRunning ? '0 0 10px rgba(0, 0, 0, 0.5)' : '' }">
    <Handle v-if="!isSender" type="target" :position="targetPosition">
      <span v-if="!data.isRunning && !data.isFinished && !data.isCancelled && !data.isSkipped && !data.hasError">📥 </span>
    </Handle>

    <Handle v-if="!isReceiver" type="source" :position="sourcePosition" />

    <div v-if="!isSender && data.isRunning" class="spinner" />
    <span v-else>
      {{ processLabel }}
    </span>
  </div>
</template>

<style scoped>
.process-node {
  padding: 10px;
  border-radius: 99px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.process-node .vue-flow__handle {
  border: none;
  height: unset;
  width: unset;
  background: transparent;
  font-size: 12px;
}
</style>
