FROM node:18-alpine

WORKDIR /app

# Install serve for static file serving
RUN npm install -g serve

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=http://localhost:8001
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# Expose port
EXPOSE 5174

# Serve the built app
CMD ["serve", "-s", "dist", "-l", "5174"]
