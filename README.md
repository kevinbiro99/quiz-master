# Project Title:

QuizMaster

# Team Name:

PageNotFounders

# Team Members:

Kevin Biro - kevin.biro@mail.utoronto.ca

Billy Zhou - billi.zhou@mail.utoronto.ca

# Deployed URL:

[quiz-master.tech](https://quiz-master.tech/)

# Video Demo URL:

https://www.youtube.com/watch?v=xPmzac-G4lE

# Brief Description of the Web Application:

QuizMaster is an innovative web application that generates real-time multiplayer quizzes from video content. Users can upload their own videos, audio files, or transcripts. The application parses the audio to text with Groq Whisper API, integrates with Groq Llama 3 to create quiz questions, and jumps to the timestamp in the video to reveal the answers.

# Required Elements Fulfillment:

- **Frontend Framework**: The frontend will be built using Vue 3 to ensure a modern and responsive user interface.
- **Single Page Application (SPA)**: The frontend will be a SPA, providing a smooth user experience without page reloads.
- **Backend API**: The backend will use Express as the core API, ensuring a robust and scalable server-side architecture. We will use a SQL backend like PostgreSQL to store users and quizzes for our application.
- **RESTful API**: The application's API will follow RESTful principles for clear and predictable interactions.
- **Deployment**: The application will be deployed on a Virtual Machine on Google Cloud using Docker and Docker Compose. All deployment files, including CI files for building images, will be committed to GitHub.
- **Accessibility**: The application will be publicly accessible (hosted with a public URL on Google Cloud) without requiring any interaction with the development team.
- **Third-party API**: The application will use the Groq Whisper API that can do audio to time stamped transcripts and will also use Groq Llama 3 to generate the quiz questions.
- **OAuth 2.0**: OAuth 2.0 will be implemented for user authentication, allowing users to sign in with their Google accounts. Can use the vue3-google-login plugin to achieve this.

# Additional Requirements Fulfillment:

- ### Real-time Functionality:
  - The application will use WebSockets to provide real-time updates for quiz sessions, reflecting user answers and score changes instantly during the question.
  - When a user clicks on an answer, other players can see a live update of the tally (correct / incorrect), and when everyone has answered, a bar graph is shown of quiz answers with the correct one highlighted and a leaderboard is updated.
  - Users can indicate to the host when they are ready for the next question
- ### Long-running Task:
  - Generating the quiz from a video will take >10s to complete for longer videos
    - Extract the audio from the video
    - Send audio to Groq Whisper API to get text from the audio with timestamps
    - Query the api of Groq Llama 3 with the extracted text to give quiz questions with answers found in the video (can take some time if we want high quality answers).
    - Find the answers to each question in the text and associate it with video timestamps of when they occur in the video
    - Create clips of the video answers to play after each question (optional toggle if player gets a question wrong or wants a reference).

# Milestones:

- ### Alpha Version (3 weeks):
  - Initial integration with Groq Whisper api to gather video information and retrieves time stamped text from audio
  - Initial OpenAI integration to generate quiz questions from the time stamped text
  - Basic quiz creation and participation functionality.
    - Create custom questions, answers, and format from transcript, audio
    - Real-time quiz updates using WebSockets
    - Score based time taken and overall correctness, can see how others did
  - Basic user authentication with OAuth 2.0.
    - Create and view own and other’s profile
  - Initial deployment setup with Docker and Docker Compose.
- ### Beta Version (2 weeks):
  - Enhanced user interface with Vue 3 components.
    - Animation, effects, and loading screen
    - Long running task gets real-time updates from the task queue
  - Add support for video uploads
  - Fix bugs and integration issues for real time quizzes.
  - Full deployment on a Virtual Machine with CI/CD pipelines.
- ### Final Version (3 weeks):
  - Show video answers after quiz at the correct timestamp
  - Polished user interface and user experience improvements.
  - Comprehensive testing and bug fixing.
  - Final deployment and public access setup.
