#!/usr/bin/env bash
# ============================================================
# 首次初始化云服务器（Ubuntu 22.04 + Nginx），只需执行一次。
#
# 用法：
#   ./scripts/bootstrap-server.sh root@43.136.175.239
#   DEPLOY_TARGET=root@1.2.3.4 ./scripts/bootstrap-server.sh
#
# 前置条件：
#   - 本地已能免密 SSH 登录服务器（见 docs/04-deployment.md「SSH 密钥登录」）
#   - 服务器是全新的 Ubuntu 22.04（腾讯云轻量 / 阿里云 ECS 均可）
#   - 安全组/防火墙已放行 22 与 80 端口
#
# 脚本做的事：
#   1. apt 更新并安装 nginx
#   2. 建立站点目录 /var/www/mysite
#   3. 上传 deploy/nginx.conf 并启用（禁用默认站点）
#   4. nginx -t 检查并启动/重载
#   5. 从本机调用 scripts/deploy.sh 上传站点文件
# ============================================================
set -euo pipefail

TARGET="${1:-${DEPLOY_TARGET:-root@your-server-ip}}"
REMOTE_DIR="/var/www/mysite"
CONF_NAME="mysite"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> 目标服务器：${TARGET}"
echo "==> 检查 SSH 连接"
ssh -o BatchMode=yes -o ConnectTimeout=8 "$TARGET" 'echo ssh-ok'

echo "==> 安装 Nginx 并建立目录"
ssh "$TARGET" "set -e
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq nginx
  mkdir -p '${REMOTE_DIR}'
  chown -R www-data:www-data '${REMOTE_DIR}'
  # 腾讯云轻量 Ubuntu 镜像可能自带 nginx 默认站点，先移除，避免抢占 80 端口
  rm -f /etc/nginx/sites-enabled/default
  nginx -v
"

echo "==> 上传并启用站点配置"
scp "${LOCAL_DIR}/deploy/nginx.conf" "${TARGET}:/tmp/${CONF_NAME}.conf"
ssh "$TARGET" "set -e
  mv /tmp/${CONF_NAME}.conf /etc/nginx/sites-available/${CONF_NAME}
  ln -sf /etc/nginx/sites-available/${CONF_NAME} /etc/nginx/sites-enabled/${CONF_NAME}
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
  systemctl is-active nginx
"

echo "==> 上传站点文件"
DEPLOY_TARGET="$TARGET" bash "${LOCAL_DIR}/scripts/deploy.sh" "$TARGET"

echo "==> 初始化完成，访问：http://${TARGET#*@}/"
