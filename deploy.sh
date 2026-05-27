#!/bin/bash
# 部署到 GitHub Pages
# 用法: bash deploy.sh
# 前提: 已经在 GitHub 创建了仓库 YOUR_USERNAME/dev-toolbox

cd "$(dirname "$0")"

echo "📦 准备部署 Dev工具箱到 GitHub Pages..."

# 检查是否在正确的目录
if [ ! -f "public/index.html" ]; then
  echo "❌ 请从 tool_site 目录运行此脚本"
  exit 1
fi

# 初始化 git（如果还没有）
if [ ! -d ".git" ]; then
  echo "🔧 初始化 Git 仓库..."
  git init
  git checkout -b main
fi

# 复制文件到根目录（GitHub Pages 要求根目录或 /docs）
echo "📋 同步文件..."
cp -r public/* .

# 添加所有文件
git add .

# 提交
git commit -m "Deploy Dev工具箱 $(date '+%Y-%m-%d %H:%M')"

# 推送到 GitHub（需要先设置 remote）
echo ""
echo "✅ 本地提交完成！"
echo ""
echo "下一步:"
echo "  1. 在 GitHub 创建仓库: dev-toolbox"
echo "  2. 添加远程: git remote add origin https://github.com/YOUR_USERNAME/dev-toolbox.git"
echo "  3. 推送: git push -u origin main"
echo "  4. 在仓库 Settings → Pages → Source 选择 main 分支"
echo "  5. 等待几分钟，访问 https://YOUR_USERNAME.github.io/dev-toolbox/"
