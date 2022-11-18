import { ref, watch } from 'vue'
import { createEventHook } from '@vueuse/core'
import type { Plugin, VueFlowStore } from '@vue-flow/core'
import { useVueFlow } from '@vue-flow/core'
import type { DragNDropState, DragNodeType, OnDragStartEventData, OnDropData } from './types'

function createDragNDrop(store: VueFlowStore): DragNDropState {
  const onDragStart = createEventHook<OnDragStartEventData>()
  const onDragOver = createEventHook<DragEvent>()
  const onDrop = createEventHook<OnDropData>()

  const nodeType = ref<DragNodeType>()

  function handleDragStart(event: DragEvent, type: DragNodeType) {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }

    nodeType.value = type
    onDragStart.trigger({ event, type })
  }

  function handleTouchStart(event: TouchEvent, type: DragNodeType) {
    nodeType.value = type

    const element = event.target as HTMLElement
    const elementCopy = element.cloneNode(true) as HTMLElement
    elementCopy.style.position = 'absolute'
    elementCopy.style.top = `${event.touches[0].clientY}px`
    elementCopy.style.left = `${event.touches[0].clientX}px`

    document.body.appendChild(elementCopy)

    const touchMoveHandler = (event: TouchEvent) => {
      elementCopy.style.top = `${event.touches[0].clientY}px`
      elementCopy.style.left = `${event.touches[0].clientX}px`
    }

    const touchEndHandler = () => {
      const elementsUnderCursor = document.elementsFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)

      if (elementsUnderCursor.length) {
        const dropTarget = elementsUnderCursor.find((el) => el.classList.contains('vue-flow'))
        if (dropTarget) {
          const dropEvent = new DragEvent('drop')
          dropTarget.dispatchEvent(dropEvent)
        }
      }

      document.body.removeChild(elementCopy)
      document.removeEventListener('touchmove', touchMoveHandler)
      document.removeEventListener('touchend', touchEndHandler)
    }

    document.addEventListener('touchmove', touchMoveHandler)
    document.addEventListener('touchend', touchEndHandler)
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    onDragOver.trigger(event)
  }

  function handleDrop(event: DragEvent) {
    const type = nodeType.value as DragNodeType

    if (!type || !store.vueFlowRef.value) return

    const { left, top } = store.vueFlowRef.value.getBoundingClientRect()

    const position = store.project({
      x: event.clientX - left,
      y: event.clientY - top,
    })

    onDrop.trigger({ event, type, position })
  }

  watch(store.viewportRef, (containerEl, _, onCleanup) => {
    if (containerEl) {
      containerEl.addEventListener('dragover', handleDragOver)
    }

    onCleanup(() => {
      if (containerEl) {
        containerEl.removeEventListener('dragover', handleDragOver)
      }
    })
  })

  watch(store.vueFlowRef, (containerEl, _, onCleanup) => {
    if (containerEl) {
      containerEl.addEventListener('drop', handleDrop)
    }

    onCleanup(() => {
      if (containerEl) {
        containerEl.removeEventListener('drop', handleDrop)
      }
    })
  })

  return {
    nodeType,
    handleDragStart,
    handleTouchStart,
    onDragStart: onDragStart.on,
    onDragOver: onDragOver.on,
    onDrop: onDrop.on,
  }
}

export const PluginDragNDrop: Plugin = (hooks) => {
  hooks.created((store) => {
    store.dragNDrop = createDragNDrop(store)
  })
}

export function useDragNDrop<CustomType extends string = string>() {
  const { dragNDrop } = useVueFlow()

  return dragNDrop as DragNDropState<CustomType>
}
