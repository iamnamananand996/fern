FROM node:20.18-alpine3.20

ENV YARN_CACHE_FOLDER=/.yarn

RUN apk --no-cache add \
    bash \
    build-base \
    curl \
    git \
    rust \
    cargo \
    zip

RUN git config --global user.name "fern" && git config --global user.email "hey@buildwithfern.com"

# Install rust toolchain
RUN rustup-init -y && \
    source $HOME/.cargo/env && \
    rustup default stable && \
    rustup component add rustfmt clippy

# Add cargo to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

RUN npm install -f -g @fern-api/generator-cli

COPY generators/rust/sdk/features.yml /assets/features.yml
COPY generators/rust/sdk/dist /dist

ENTRYPOINT ["node", "/dist/cli.cjs"] 