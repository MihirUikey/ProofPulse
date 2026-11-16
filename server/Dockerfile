
# Use the official Node.js 22 image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Document the port used by the application
EXPOSE 5000

# Start the backend
CMD ["npm", "start"]
