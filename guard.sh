#!/bin/bash
# Dev工具箱 — 守护进程
# 自动重启服务器 + 隧道，URL 变化时记录

LOG="$HOME/reasonix_earnings/tool_site/url.txt"
PUBLIC="$HOME/reasonix_earnings/tool_site/public"

echo "🚀 Dev工具箱守护进程启动 $(date)" >> "$LOG"

while true; do
    # 1. 启动 Node 服务器
    node "$HOME/reasonix_earnings/tool_site/server.js" &
    SERVER_PID=$!
    sleep 2

    # 2. 启动 serveo 隧道，捕获 URL
    TUNNEL_OUT=$(mktemp)
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 \
        -o ExitOnForwardFailure=yes \
        -R 80:localhost:8080 serveo.net 2>&1 &
    TUNNEL_PID=$!

    # 等待 URL 出现
    for i in $(seq 1 10); do
        URL=$(grep -o 'https://[a-z0-9.-]*serveo[a-z]*\.com' "$TUNNEL_OUT" 2>/dev/null | head -1)
        if [ -n "$URL" ]; then
            echo "✅ $(date '+%Y-%m-%d %H:%M:%S') | $URL" >> "$LOG"
            echo "CURRENT_URL=$URL" > "$PUBLIC/current-url.txt"
            break
        fi
        sleep 1
    done

    # 3. 等待任一进程退出
    wait -n $SERVER_PID $TUNNEL_PID 2>/dev/null

    # 4. 清理
    kill $SERVER_PID $TUNNEL_PID 2>/dev/null
    wait $SERVER_PID $TUNNEL_PID 2>/dev/null
    rm -f "$TUNNEL_OUT"

    echo "⚠️ $(date '+%Y-%m-%d %H:%M:%S') 进程退出，5秒后重启..." >> "$LOG"
    sleep 5
done
