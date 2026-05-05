FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=build /app/frontend/package.json frontend/package.json
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend backend
COPY --from=build /app/frontend/dist frontend/dist
RUN mkdir -p backend/data
EXPOSE 4000
CMD ["npm", "start"]
