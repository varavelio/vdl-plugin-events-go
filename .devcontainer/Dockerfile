# Use node as the base image
FROM node:24.14.0-trixie

# Set environment variables
ENV DEBIAN_FRONTEND="noninteractive"

RUN set -e && \
    # Update and install system dependencies
    apt-get update -qq && \
    apt-get install -yqq --no-install-recommends \
        git wget curl zip unzip p7zip-full tree ripgrep && \
    # Clean up
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Add the startup script on every bash session
COPY .devcontainer/.bashrc /root/.bashrc

# Command just to keep the container running
CMD ["sleep", "infinity"]
