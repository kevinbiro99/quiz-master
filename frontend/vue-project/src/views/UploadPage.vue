<template>
  <div class="main-content container">
    <h2>Upload a Quiz</h2>
    <input type="file" accept=".txt,.mp3,.mp4" @change="handleFileUpload" />
    <button @click="submitFile">Submit</button>
    <p v-if="fileUploaded">File Uploaded!</p>
    <p v-if="invalidFile">Invalid file type</p>
  </div>
</template>

<script>
import apiService from '@/services/api-service'
import { inject } from 'vue'

export default {
  data() {
    return {
      fileUploaded: false,
      invalidFile: false,
      file: null,
      authState: inject('authState')
    }
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0]
      this.file = file
      this.fileUploaded = false
    },
    submitFile() {
      if (this.file) {
        this.fileUploaded = true
        this.invalidFile = false
        if (this.file.type === 'text/plain') {
          apiService
            .createQuizFromTxt(this.authState.userId, this.file)
            .then(() => {
              setTimeout(() => {
                this.$router.push('/host')
              }, 0.5)
            })
            .catch((error) => {
              console.log(error)
            })
        } else if (this.file.type === 'audio/mpeg') {
          apiService
            .createQuizFromAudio(this.authState.userId, this.file)
            .then(() => {
              setTimeout(() => {
                this.$router.push('/host')
              }, 0.5)
            })
            .catch((error) => {
              console.log(error)
            })
        } else if (this.file.type === 'video/mp4') {
          apiService
            .createQuizFromVideo(this.authState.userId, this.file)
            .then(() => {
              setTimeout(() => {
                this.$router.push('/host')
              }, 0.5)
            })
            .catch((error) => {
              console.log(error)
            })
        } else {
          this.invalidFile = true
        }
      } else {
        console.log('No file selected')
      }
    }
  }
}
</script>
