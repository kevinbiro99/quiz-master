FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY .env .env
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]