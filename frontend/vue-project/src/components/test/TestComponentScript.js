import api from '@/services/api-service'

export default {
  data() {
    return {
      message: '',
      error: ''
    }
  },
  created() {
    this.fetchMessage()
  },
  methods: {
    async fetchMessage() {
      try {
        const response = await api.getUsers()
        this.message = response
      } catch (error) {
        this.error = error
        console.error('Error fetching message:', error)
      }
    }
  }
}
