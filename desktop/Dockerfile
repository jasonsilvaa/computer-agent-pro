FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99

RUN apt-get update && apt-get install -y \
    xvfb \
    xfce4 \
    x11vnc \
    firefox \
    dbus-x11 \
    python3 \
    python3-pip \
    python3-venv \
    python3-tk \
    python3-dev \
    scrot \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN pip install --upgrade pip && pip install flask pyautogui mss pillow
COPY api.py .

# noVNC is served by a separate service or we run it here
RUN apt-get update && apt-get install -y \
    novnc \
    websockify \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 5000 6080

COPY start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
