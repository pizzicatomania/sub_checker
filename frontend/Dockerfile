# 1단계: 빌드 (Node 사용)
FROM node:20 AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 서빙 (Nginx 사용)
FROM nginx:stable-alpine
# 빌드된 결과물만 Nginx로 복사
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Nginx 설정 (필요시 추가)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]