FROM node:20-bullseye

WORKDIR /app

# install system build tools and rust toolchain
RUN apt-get update && \
    apt-get install -y python3 build-essential make g++ rustc cargo libc6-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# copy package files and install
COPY package*.json ./
RUN npm install

# copy source
COPY . .

# ensure lightningcss is rebuilt for this environment
RUN npm rebuild lightningcss || true

# build app
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
