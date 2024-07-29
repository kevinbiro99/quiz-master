<template>
  <div class="main-content container">
    <h2>Upload a Quiz</h2>
    <div
      class="file-upload"
      @dragover.prevent
      @drop.prevent="handleFileDrop"
      @click="triggerFileInput"
    >
      <div class="file-types">
        <img src="@/assets/txt.png" alt="TXT File" class="file-icon" />
        <img src="@/assets/mp3.png" alt="MP3 File" class="file-icon" />
        <img src="@/assets/mp4.png" alt="MP4 File" class="file-icon" />
      </div>
      <p>Drag files here to upload or</p>
      <button type="button" class="upload-button">Choose File</button>
      <input
        type="file"
        ref="fileInput"
        accept=".txt,.mp3,.mp4"
        @change="handleFileUpload"
        hidden
      />
    </div>
    <div v-if="state.file || state.filename" class="file-card">
      <p>{{ state.filename }}</p>
      <p v-if="state.loading">{{ state.loadingMessage }}</p>
      <div class="progress-bar">
        <div class="progress" :style="{ width: state.uploadProgress + '%' }"></div>
      </div>
    </div>
    <button
      @click="submitFile"
      class="submit-button"
      :disabled="!state.file || state.invalidFile || state.loading"
    >
      Submit
    </button>
    <p v-if="state.fileUploaded">File Uploaded!</p>
    <p>{{ state.errorMessage }}</p>
    <div v-if="state.loading" class="job-progress">
      <p>Job Progress:</p>
      <div class="progress-bar">
        <div
          class="progress"
          :style="{ width: (100 * state.currentPhase) / state.numPhases + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '@/services/api-service'
import { useAuthStore } from '@/stores/index'
import { environment } from '@/environments/environment'

export default {
  setup() {
    const authState = useAuthStore()
    const router = useRouter()
    const fileInput = ref(null)
    const state = reactive({
      fileUploaded: false,
      invalidFile: false,
      file: null,
      filename: '',
      uploadProgress: 0, // Progress bar percentage
      jobProgress: 0, // Job progress percentage
      currentPhase: 0, // Current phase of the upload process
      numPhases: 0, // Total number of phases in the upload process
      errorMessage: '',
      loading: false,
      loadingMessage: '',
      eventSource: null,
      jobId: '' // Initialize jobId state
    })

    const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes

    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (
        file &&
        ['text/plain', 'audio/mpeg', 'video/mp4'].includes(file.type) &&
        file.size <= MAX_FILE_SIZE
      ) {
        state.file = file
        state.filename = file.name
        state.invalidFile = false
        state.fileUploaded = false
        state.uploadProgress = 0
        state.errorMessage = ''
      } else {
        state.file = null
        state.filename = ''
        state.invalidFile = true
        state.errorMessage =
          file?.size > MAX_FILE_SIZE
            ? 'File size exceeds 25MB. Please upload a smaller file.'
            : 'Invalid file type. Please upload a .txt, .mp3, or .mp4 file.'
      }
    }

    const handleFileDrop = (event) => {
      const file = event.dataTransfer.files[0]
      if (
        file &&
        ['text/plain', 'audio/mpeg', 'video/mp4'].includes(file.type) &&
        file.size <= MAX_FILE_SIZE
      ) {
        state.file = file
        state.filename = file.name
        state.invalidFile = false
        state.fileUploaded = false
        state.uploadProgress = 0
        state.errorMessage = ''
      } else {
        state.file = null
        state.filename = ''
        state.invalidFile = true
        state.errorMessage =
          file.size > MAX_FILE_SIZE
            ? 'File size exceeds 25MB. Please upload a smaller file.'
            : 'Invalid file type. Please upload a .txt, .mp3, or .mp4 file.'
      }
    }

    const triggerFileInput = () => {
      fileInput.value.click()
    }

    const submitFile = () => {
      if (state.file) {
        state.fileUploaded = false
        state.invalidFile = false
        state.errorMessage = ''
        state.loading = true
        let apiMethod
        let uploadPhases = []

        if (state.file.type === 'text/plain') {
          apiMethod = apiService.createQuizFromTxt
          uploadPhases = ['Transcribing text...', 'Extracting questions...', 'Creating quiz...']
        } else if (state.file.type === 'audio/mpeg') {
          apiMethod = apiService.createQuizFromAudio
          uploadPhases = [
            'Transcribing audio...',
            'Transcribing text...',
            'Extracting questions...',
            'Creating quiz...'
          ]
        } else if (state.file.type === 'video/mp4') {
          apiMethod = apiService.createQuizFromVideo
          uploadPhases = [
            'Converting video to audio...',
            'Transcribing audio...',
            'Transcribing text...',
            'Extracting questions...',
            'Creating quiz...'
          ]
        } else {
          state.invalidFile = true
          state.errorMessage = 'Invalid file type. Please upload a .txt, .mp3, or .mp4 file.'
          state.loading = false
          return
        }

        state.loadingMessage = 'Uploading file...'
        state.numPhases = uploadPhases.length
        apiMethod(authState.userId, state.file)
          .then((res) => {
            state.jobId = res.jobId
            localStorage.setItem('filename', state.filename) // Store filename in localStorage
            localStorage.setItem('jobId', state.jobId) // Store jobId in localStorage
            localStorage.setItem('uploadPhases', JSON.stringify(uploadPhases)) // Store uploadPhases in localStorage
            setupSSE(state.jobId, uploadPhases) // Pass uploadPhases to SSE setup
          })
          .catch((error) => {
            handleUploadError(error)
          })
      } else {
        state.errorMessage = 'No file selected. Please choose a file to upload.'
      }
    }

    const setupSSE = (jobId, uploadPhases) => {
      if (state.eventSource) {
        state.eventSource.close()
      }
      state.currentPhase = 0

      state.eventSource = new EventSource(`${environment.apiEndpoint}/api/progress/${jobId}`)
      state.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.error) {
          console.error('SSE error:', data.error)
          state.errorMessage = 'An error occurred while processing the job: ' + data.error
          state.loading = false
          state.eventSource.close() // Close the SSE connection
          return // Exit early
        }

        if (state.uploadProgress < 100) {
          state.uploadProgress += 20
          // Ensure uploadProgress does not exceed 95, data.progress will handle the rest
          state.uploadProgress = Math.min(state.uploadProgress, 95)
          if (state.jobProgress !== data.progress || data.progress === 100) {
            state.uploadProgress = 100
          }
        } else {
          if (state.jobProgress !== data.progress || data.progress === 100) {
            if (state.currentPhase < uploadPhases.length - 1) {
              state.currentPhase++
              state.loadingMessage = uploadPhases[state.currentPhase]
              state.uploadProgress = 0
            } else {
              localStorage.removeItem('filename') // Remove filename from localStorage
              localStorage.removeItem('jobId') // Remove jobId from localStorage
              localStorage.removeItem('uploadPhases') // Remove uploadPhases from localStorage
              state.fileUploaded = true
              state.loading = false
              router.push('/host')
            }
          }
          state.jobProgress = data.progress
        }
      }
      state.eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        state.errorMessage = 'An error occurred while receiving progress updates. Please try again.'
        state.loading = false
        localStorage.removeItem('filename')
        localStorage.removeItem('jobId') // Remove jobId from localStorage
        localStorage.removeItem('uploadPhases') // Remove uploadPhases from localStorage
      }
    }

    const handleUploadError = (error) => {
      console.error(error)
      state.errorMessage = 'An error occurred while uploading the file. Please try again.'
      state.loading = false
    }

    onMounted(() => {
      // check if there are any jobs in progress
      const jobId = localStorage.getItem('jobId')
      const uploadPhases = JSON.parse(localStorage.getItem('uploadPhases'))
      const filename = localStorage.getItem('filename')
      if (jobId) {
        state.jobId = jobId
        state.filename = filename
        state.loading = true
        state.numPhases = uploadPhases.length
        setupSSE(state.jobId, uploadPhases)
      }
    })

    onUnmounted(() => {
      if (state.eventSource) {
        state.eventSource.close()
      }
    })

    return {
      fileInput,
      state,
      handleFileUpload,
      handleFileDrop,
      triggerFileInput,
      submitFile
    }
  }
}
</script>

<style scoped>
@import '@/assets/base.css';

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: var(--color-background);
  color: var(--color-text);
}

.file-upload {
  margin: 10px;
  border: 2px dashed var(--color-border);
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  position: relative;
  animation: pulse 4s infinite;
}

.file-types {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.file-icon {
  width: 50px;
  height: 50px;
}

.file-upload p {
  margin: 0 0 10px;
  color: var(--color-text);
}

.upload-button {
  background-color: var(--color-highlight);
  color: var(--color-text);
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.upload-button:hover {
  background-color: var(--color-gradient-end);
}

.submit-button {
  margin-top: 20px;
  background-color: var(--color-highlight);
  color: var(--color-text);
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.submit-button:hover {
  background-color: var(--color-gradient-end);
}

.submit-button:disabled {
  background-color: var(--color-border);
  cursor: not-allowed;
}

.file-card {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background-color: var(--color-background-soft);
  width: 100%;
  max-width: 300px;
  text-align: center;
}

.job-progress {
  margin-top: 20px;
  width: 100%;
  max-width: 300px;
}

.progress-bar {
  height: 10px;
  background-color: var(--color-border);
  border-radius: 5px;
  overflow: hidden;
  margin-top: 10px;
  position: relative;
}

.progress {
  height: 100%;
  background-color: var(--color-highlight);
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: animate 2s linear infinite;
}

.progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: animate 2s linear infinite;
  filter: blur(20px);
}

@keyframes animate {
  0% {
    background-position: 0 0;
  }
  0% {
    background-position: 200% 0;
  }
}

.error-message {
  color: red;
  margin-top: 10px;
}

@keyframes pulse {
  0% {
    border-color: var(--color-border);
  }
  50% {
    border-color: var(--color-highlight);
  }
  100% {
    border-color: var(--color-border);
  }
}
</style>
