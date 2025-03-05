FROM nginx:1.21-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY ./docker/nginx/nginx.conf /etc/nginx/nginx.conf


COPY ./metrics/visualization /usr/share/nginx/html/metrics


RUN mkdir -p /usr/share/nginx/html
RUN mkdir -p /var/log/nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]