FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public /usr/share/nginx/html

RUN mkdir -p /usr/share/nginx/videos

RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/video_access.log && \
    chmod 777 /var/log/nginx/video_access.log

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]