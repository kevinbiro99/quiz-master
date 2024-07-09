<template>
  <div class="main-content container">
    <h2>Upload a Quiz</h2>
    <input type="file" accept=".txt,.mp3" @change="handleFileUpload" />
    <button @click="submitFile">Submit</button>
    <p v-if="fileUploaded">File Uploaded!</p>
    <p v-if="invalidFile">Invalid file type</p>
  </div>
</template>

<script>
import apiService from '@/services/api-service'

export default {
  data() {
    return {
      fileUploaded: false,
      invalidFile: false
    }
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file.type === 'text/plain') {
        this.file = file
      } else {
        this.fileUploaded = false
      }
    },
    submitFile() {
      if (this.file) {
        this.fileUploaded = true
        this.invalidFile = false
        apiService
          .createQuizFromTxt(this.userId, this.file)
          .then((response) => {
            console.log(response)
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        console.log('No file selected')
      }
    }
  }
}
</script>
