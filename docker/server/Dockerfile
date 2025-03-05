FROM ubuntu:22.04


RUN apt-get update && apt-get install -y \
    vlc \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    net-tools \
    procps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


RUN mkdir -p /opt/vlc-server/scripts
RUN mkdir -p /opt/vlc-server/config
RUN mkdir -p /opt/vlc-server/logs
RUN mkdir -p /media/storage


COPY ./server/scripts /opt/vlc-server/scripts
COPY ./server/config /opt/vlc-server/config


RUN chmod +x /opt/vlc-server/scripts/*.sh
RUN chmod -R 777 /opt/vlc-server/logs
RUN chmod 777 /media/storage


RUN pip3 install requests psutil


RUN useradd -m vlcuser
RUN chown -R vlcuser:vlcuser /opt/vlc-server
RUN chown -R vlcuser:vlcuser /media/storage


EXPOSE 8080 8554 1234 5004/udp


ENV VLC_VERBOSE=3
ENV MEDIA_PATH=/media/storage


USER vlcuser


CMD ["/opt/vlc-server/scripts/start_streaming.sh"]