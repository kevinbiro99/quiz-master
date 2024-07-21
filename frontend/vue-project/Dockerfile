# Stage 1: Build the Vue 3 app
FROM node:22 as build
ARG VITE_VUE_APP_API_URL=https://api.quiz-master.tech
ENV VITE_VUE_APP_API_URL=$VITE_VUE_APP_API_URL
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the static files with NGINX
FROM nginx:1.21.6-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
