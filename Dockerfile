FROM oven/bun:1.1 AS builder
WORKDIR /app


COPY package.json .
COPY bun.lockb .


RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Stage 2 - serve with nginx
FROM nginx:stable-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
