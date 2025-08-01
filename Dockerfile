FROM nginx:alpine

RUN apk add --no-cache wget

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public /usr/share/nginx/html

COPY download-videos.sh /download-videos.sh
RUN chmod +x /download-videos.sh

RUN mkdir -p /usr/share/nginx/videos

RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/video_access.log && \
    touch /var/log/nginx/video_timing.log && \
    chmod 777 /var/log/nginx/video_access.log && \
    chmod 777 /var/log/nginx/video_timing.log

EXPOSE 80

CMD /download-videos.sh && nginx -g "daemon off;"