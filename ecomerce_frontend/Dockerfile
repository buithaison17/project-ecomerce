# Stage 1: Build the React app
FROM node:24 AS build
# Set the working directory
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the app files
COPY . .
# Build the app
RUN npm run build
# Stage 2: Serve with Nginx
FROM nginx:alpine
# Remove the default Nginx content
RUN rm -rf /usr/share/nginx/html/*
# Copy the build output from the first stage
COPY --from=build /app/dist/ /usr/share/nginx/html/
# Expose port 80
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
