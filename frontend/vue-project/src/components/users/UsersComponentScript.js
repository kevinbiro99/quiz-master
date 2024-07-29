import api from '@/services/api-service'
import { vLoading } from '@/directives/LoadingDirective'

export default {
  directives: {
    loading: vLoading
  },
  setup() {
    'use strict'
  },
  data() {
    return {
      users: [],
      error: '',
      isLoading: false,
      currentPage: 1,
      pageSize: 10, // default page size
      totalPages: 0 // total number of pages
    }
  },
  created() {
    this.fetchUsers()
  },
  onBeforeUnmount() {
    this.isLoading = false
  },
  methods: {
    fetchUsers() {
      this.isLoading = true
      this.error = ''
      const offset = this.currentPage - 1
      api
        .getUsers(offset, this.pageSize)
        .then((response) => {
          this.isLoading = false
          this.users = response.users
          this.totalPages = response.numPages
        })
        .catch((error) => {
          this.isLoading = false
          this.error = error.message || 'Error fetching users'
          console.error('Error fetching users:', error)
        })
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.fetchUsers()
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.fetchUsers()
      }
    }
  }
}
