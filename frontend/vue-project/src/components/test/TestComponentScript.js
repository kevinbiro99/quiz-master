import api from '@/services/api-service'

export default {
  data() {
    return {
      users: [],
      error: ''
    }
  },
  created() {
    this.fetchMessage()
  },
  methods: {
    async fetchMessage() {
      try {
        api.getUsers().then((response) => {
          this.users = response
        })
      } catch (error) {
        this.error = error
        console.error('Error fetching message:', error)
      }
    }
  }
}
