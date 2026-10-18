#########
# TOOLS #
#########

# Use node as the base image
FROM node:26.12.0-trixie as tools

# Install golang
COPY --from=golang:1.27.2-trixie /usr/local/go /usr/local/go
ENV PATH="/usr/local/go/bin:${PATH}"

# Environment variables
ENV \
  PIP_BREAK_SYSTEM_PACKAGES=1 \
  CGO_ENABLED=0

# Build time variables
ARG DEBIAN_FRONTEND=noninteractive

RUN set -e && \
    # Update and install system dependencies
    apt-get update -qq && \
    apt-get install -yqq --no-install-recommends \
        git wget curl zip unzip p7zip-full tree ripgrep python3 python3-pip && \
    rm -rf /var/lib/apt/lists/* && \
    # Git config
    git config --system --add safe.directory '*'

WORKDIR /workspaces/vdl-plugin-events-go

################
# DEVCONTAINER #
################

FROM tools AS devcontainer

CMD ["sleep", "infinity"]
