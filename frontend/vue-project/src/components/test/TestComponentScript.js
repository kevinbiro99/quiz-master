import api from '@/services/api-service'
import { vLoading } from '@/directives/LoadingDirective'

export default {
  directives: {
    loading: vLoading
  },
  data() {
    return {
      users: [],
      error: '',
      isLoading: false
    }
  },
  created() {
    this.fetchMessage()
  },
  onBeforeUnmount() {
    this.isLoading = false
  },
  methods: {
    fetchMessage() {
      this.isLoading = true
      try {
        api.getUsers().then((response) => {
          this.isLoading = false
          this.users = response
        })
      } catch (error) {
        this.error = error
        console.error('Error fetching message:', error)
      }
    }
  }
}
