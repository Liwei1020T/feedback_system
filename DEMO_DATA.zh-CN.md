# Demo数据说明 (中文)

## 快速开始

### 1. 一键启动（带Demo数据）

```bash
docker-compose up -d
```

### 2. 访问系统

- **前端界面**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

### 3. 登录测试

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | 管理员 |
| `superadmin` | `superadmin123` | 超级管理员 |

## Demo数据包含什么？

✅ **10+ 用户账户** - 覆盖所有部门（IT、HR、薪资、设施、安全）
✅ **12+ 投诉案例** - 真实场景，包括IT问题、设施维修、薪资疑问等
✅ **多个回复** - 管理员的处理回复
✅ **内部备注** - 团队协作记录
✅ **不同状态** - 待处理、处理中、已解决
✅ **多工厂数据** - P1, P2, BK 三个工厂
✅ **AI评分** - 自动分类的置信度分数

## 验证Demo数据

```bash
# 运行测试脚本
chmod +x scripts/test_demo_data.sh
./scripts/test_demo_data.sh
```

预期输出：
```
✓ 容器运行中
✓ 应用就绪
✓ 登录成功
✓ 找到 10 个用户
✓ 找到 12+ 个投诉
✓ Demo数据验证成功！
```

## 常用操作

### 禁用Demo数据（生产环境）

```bash
SEED_DEMO_DATA=false docker-compose up -d
```

### 重置Demo数据

```bash
# 停止容器
docker-compose down

# 删除数据卷
docker volume rm feedback_feedback-data

# 重新启动（会自动创建新的Demo数据）
docker-compose up -d
```

### 添加更多Demo数据

```bash
docker exec feedback-app python scripts/seed_demo_data.py
```

### 备份数据

```bash
# 备份数据库
docker cp feedback-app:/app/data/db.json ./backup-db.json

# 恢复数据库
docker cp ./backup-db.json feedback-app:/app/data/db.json
docker-compose restart
```

### 查看日志

```bash
# 实时日志
docker-compose logs -f

# 最近100行
docker-compose logs --tail=100
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `scripts/docker-entrypoint.sh` | Docker启动脚本，自动检测并初始化Demo数据 |
| `scripts/seed_demo_data.py` | 增强的Demo数据生成脚本（可选执行） |
| `scripts/test_demo_data.sh` | 自动化测试脚本，验证部署状态 |
| `DEMO_DATA.md` | 完整的英文文档 |
| `QUICKSTART.md` | 快速启动指南（英文） |

## 故障排查

### 问题：Demo数据没有出现

```bash
# 检查环境变量
docker exec feedback-app env | grep SEED_DEMO

# 查看启动日志
docker-compose logs feedback-app | grep -i seed

# 确认数据库文件
docker exec feedback-app ls -lh /app/data/
```

### 问题：无法登录

```bash
# 确认Admin用户存在
docker exec feedback-app python -c "
from app.datastore import InMemoryDB
db = InMemoryDB()
for u in db.list_users():
    print(f'{u.username}: {u.role}')
"
```

### 问题：容器无法启动

```bash
# 查看详细日志
docker-compose logs feedback-app

# 检查端口占用
lsof -i :8000

# 重新构建
docker-compose down
docker-compose up -d --build
```

## 安全提醒 ⚠️

**生产环境必须做的事情：**

1. **更改所有默认密码**
2. **禁用Demo数据**: `SEED_DEMO_DATA=false`
3. **设置强JWT密钥**: 在 `.env` 文件中配置
4. **配置CORS**: 设置正确的允许域名
5. **配置SMTP**: 设置真实的邮件服务器

## 更多信息

- 📖 完整文档：[DEMO_DATA.md](DEMO_DATA.md)
- 🚀 快速指南：[QUICKSTART.md](QUICKSTART.md)
- 📋 实现总结：[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- 🌟 主要文档：[README.md](README.md)

## 技术支持

遇到问题？
1. 查看日志：`docker-compose logs -f`
2. 运行测试：`./scripts/test_demo_data.sh`
3. 查看健康状态：http://localhost:8000/health
4. 查看API文档：http://localhost:8000/docs
