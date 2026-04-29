FROM nginx:1.27-alpine

COPY src/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html/
