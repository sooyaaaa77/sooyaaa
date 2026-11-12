#!/usr/bin/env bash
# ============================================================
# 一键部署脚本：把本地静态文件打包上传到云服务器，由 Nginx 提供访问。
#
# 用法：
#   ./scripts/deploy.sh 用户@服务器IP
#   DEPLOY_TARGET=root@1.2.3.4 ./scripts/deploy.sh
#
# 前置条件：
#   - 本地已能用 SSH 密钥登录服务器（ssh 用户@IP 免密）
#   - 服务器已安装 Nginx，站点目录为 /var/www/mysite（见 docs/04-deployment.md）
#   - 用户有 sudo 权限
# ============================================================
set -euo pipefail

# 支持从环境变量读取默认值，方便反复部署
TARGET="${1:-${DEPLOY_TARGET:-root@your-server-ip}}"
REMOTE_DIR="${DEPLOY_DIR:-/var/www/mysite}"

# 需要上传的站点文件（新增文件时在这里补上）
SITE_FILES=(
  index.html
  404.html
  style.css
  main.js
  favicon.svg
  resume.pdf
)

for f in "${SITE_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "错误：缺少文件 $f" >&2
    exit 1
  fi
done

# 可选：通过 SSH_KEY 指定私钥（Windows 本地常见），不填则用默认 ~/.ssh 配置
SSH_OPTS=()
if [ -n "${SSH_KEY:-}" ]; then
  SSH_OPTS=(-i "${SSH_KEY}" -o StrictHostKeyChecking=accept-new)
fi

ARCHIVE="mysite-$(date +%Y%m%d-%H%M%S).tar.gz"
trap 'rm -f "$ARCHIVE"' EXIT

echo "==> 打包静态文件 -> ${ARCHIVE}"
tar -czf "$ARCHIVE" "${SITE_FILES[@]}"

echo "==> 上传到 ${TARGET}:/tmp/${ARCHIVE}"
scp "${SSH_OPTS[@]}" "$ARCHIVE" "${TARGET}:/tmp/${ARCHIVE}"

echo "==> 在服务器上解压并重载 Nginx"
ssh "${SSH_OPTS[@]}" "$TARGET" "set -e
  sudo mkdir -p '${REMOTE_DIR}'
  sudo tar -xzf '/tmp/${ARCHIVE}' -C '${REMOTE_DIR}'
  sudo chown -R www-data:www-data '${REMOTE_DIR}'
  sudo chmod -R 755 '${REMOTE_DIR}'
  rm -f '/tmp/${ARCHIVE}'
  sudo nginx -t
  sudo systemctl reload nginx
"

echo "==> 部署完成，访问：http://${TARGET#*@}/"
