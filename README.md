# Project Title: 
QuizMaster

# Team Name: 
PageNotFounders

# Team Members:
Kevin Biro - kevin.biro@mail.utoronto.ca

Billy Zhou - billi.zhou@mail.utoronto.ca 

# Brief Description of the Web Application:	
QuizMaster is an interactive, real-time quiz application designed for educational and entertainment purposes. Users can create, share, and participate in quizzes together seamlessly. The application provides real-time updates, tracks scores, and supports various question formats to enhance engagement.

# Required Elements Fulfillment:
- **Frontend Framework**: The frontend will be built using Vue 3 to ensure a modern and responsive user interface.
- **Single Page Application (SPA)**: The frontend will be a SPA, providing a smooth user experience without page reloads.
- **Backend API**: The backend will use Express as the core API, ensuring a robust and scalable server-side architecture.
- **RESTful API**: The application's API will follow RESTful principles for clear and predictable interactions.
- **Deployment**: The application will be deployed on a Virtual Machine on Google Cloud using Docker and Docker Compose. All deployment files, including CI files for building images, will be committed to GitHub.
- **Accessibility**: The application will be publicly accessible (hosted with a public URL on Google Cloud) without requiring any interaction with the development team.
- **Third-party API**: The application will integrate with the Open Trivia Database API to fetch trivia questions.
- **OAuth 2.0**: OAuth 2.0 will be implemented for user authentication, allowing users to sign in with their Google accounts. Can use the vue3-google-login plugin to achieve this.

# Additional Requirements Fulfillment:
- ### Real-time Functionality:
  - The application will use WebSockets to provide real-time updates for quiz sessions, reflecting user answers and score changes instantly.
  - Potential enhancement: add a collaborative quiz editor where multiple users can work together in real-time to create, edit, and organize quiz questions. This feature will include the ability to see other users' mouse movements on the screen, similar to how Figma allows for collaborative design.
- ### Long-running Task:
  - The application will include a feature for generating detailed quiz reports, which might take more than 10 seconds to compile, especially for large datasets.
- ### Webhook from an external service: 
  - Can set up a notification system for the application when a quiz is completed or when user gets challenged to a quiz off, the creator is notified through Slack
Whenever a quiz is completed, automatically update a Google Sheet with the quiz results. This can be useful for tracking performance over time or for further analysis.

# Milestones:
- ### Alpha Version (3 weeks):
    - Basic quiz creation and participation functionality.
        - Create custom questions, answers, and format, or use question from Open Trivia
        - Score based time taken and overall correctness, can see how others did
    - Integration with Open Trivia Database API.
    - Basic user authentication with OAuth 2.0.
        - Create and view own and other’s profile
    - Initial deployment setup with Docker and Docker Compose.
    - Real-time quiz updates using WebSockets.
        - How user did compared to others
- ### Beta Version (2 weeks):
    - Enhanced user interface with Vue 3 components.
        - Animation, effects, and loading screen
    - Detailed quiz reporting functionality.
        - Performance history, can sort view by week, month, year, in form of chart or graph
    - Full deployment on a Virtual Machine with CI/CD pipelines.
- ### Final Version (3 weeks):
    - Polished user interface and user experience improvements.
    - Comprehensive testing and bug fixing.
    - Final deployment and public access setup.
    - Documentation and user guides.
