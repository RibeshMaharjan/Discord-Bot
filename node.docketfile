# Use the official Node.js image as the base
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Install yt-dlp (the Python-based video downloader)
RUN apt-get update && apt-get install -y curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy the rest of the project files
COPY . .

# Expose the port your app runs on (if needed)
EXPOSE 3000

# Start your bot application
CMD ["node", "index.js"]  # Adjust this to the entry point of your bot
