import { createApp, h, nextTick } from 'vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

export const vLoading = {
  mounted(el, binding) {
    // Create a new Vue application for the loading spinner
    const app = createApp({
      data() {
        return {
          visible: binding.value
        }
      },
      render() {
        return h(LoadingSpinner, { visible: this.visible })
      }
    })

    // Mount the application to a new div
    const container = document.createElement('div')
    const instance = app.mount(container)

    // Store references on the element
    el.loadingInstance = instance
    el.loadingApp = app
    el.loadingContainer = container

    // Append the container to the element
    el.appendChild(container)
  },
  updated(el, binding) {
    // Check if the loadingInstance and its element are defined before accessing
    if (el.loadingInstance && el.loadingContainer) {
      nextTick(() => {
        el.loadingInstance.visible = binding.value
        el.loadingContainer.style.display = binding.value ? 'flex' : 'none'
      })
    }
  },
  unmounted(el) {
    // Unmount the Vue application and remove the container
    if (el.loadingApp) {
      el.loadingApp.unmount()
    }
    if (el.loadingContainer) {
      el.removeChild(el.loadingContainer)
    }
  }
}
