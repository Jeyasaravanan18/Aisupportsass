FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Accept build arg for API URL (empty = use /api proxy)
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
