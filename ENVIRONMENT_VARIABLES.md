# Environment Variables & Configuration Guide

This document outlines the environment configuration variables used across the **E-Commerce Order and Customer Analytics System**.

---

## 1. Backend Environment Configuration (`backend/.env`)

The backend Express application uses `dotenv` to load environment variables from `backend/.env`.

### Configuration Variables Reference

| Variable | Description | Default Value | Required? | Example |
| :--- | :--- | :---: | :---: | :--- |
| `PORT` | HTTP port on which the Express server listens | `5000` | No | `5000` |
| `NODE_ENV` | Application runtime environment (`development` / `production`) | `development` | No | `development` |
| `DB_HOST` | Hostname or IP address of the MySQL server | `127.0.0.1` | Yes | `127.0.0.1` |
| `DB_PORT` | TCP port of the MySQL server | `3306` | Yes | `3306` |
| `DB_USER` | MySQL database username | `root` | Yes | `root` |
| `DB_PASSWORD` | Password for the MySQL database user | *(empty)* | Yes | `MySecurePass@123` |
| `DB_NAME` | Target database catalog name | `shop` | Yes | `shop` |
| `DB_CONNECTION_LIMIT` | Maximum connections in the `mysql2` connection pool | `15` | No | `20` |
| `DB_ANALYST_USER` | Restricted read-only user for SQL Query Lab & EXPLAIN | `analyst` | No | `analyst` |
| `DB_ANALYST_PASSWORD` | Password for analyst read-only user | `Pass@123` | No | `Pass@123` |

### Sample `backend/.env` File
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Connection Parameters (Full Privileges Pool)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=shop

# Analyst Read-Only Connection Pool (Least-Privilege Security Sandbox)
DB_ANALYST_USER=analyst
DB_ANALYST_PASSWORD=Pass@123
```

---

## 2. Frontend Configuration (`frontend/`)

During local development with Vite, frontend requests to `/api` and `/health` are automatically forwarded to `http://localhost:5000` via the proxy configured in `frontend/vite.config.ts`.

### Production Build Configuration
For a production deployment where frontend and backend are hosted on separate domains or cloud services, you can optionally create `frontend/.env.production`:

```env
# Production API Base URL (optional override)
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## 3. Database User Access Recommendations

For academic demonstration and local testing, connecting as `root` is sufficient. However, for enterprise deployments or security testing, use dedicated role-restricted accounts:

### 1. Application Service Account (`shop_app`)
Possesses standard DML privileges on the `shop` schema:
```sql
CREATE USER IF NOT EXISTS 'shop_app'@'%' IDENTIFIED BY 'StrongPass@2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON shop.* TO 'shop_app'@'%';
FLUSH PRIVILEGES;
```

### 2. Read-Only Analyst Account (`analyst`)
Demonstrates Data Control Language (DCL) read-only access (tested in Test 7):
```sql
CREATE USER IF NOT EXISTS 'analyst'@'%' IDENTIFIED BY 'Pass@123';
GRANT SELECT ON shop.* TO 'analyst'@'%';
FLUSH PRIVILEGES;
```

### 3. Inventory & Order Clerk Account (`clerk`)
Possesses restricted permissions to create and inspect orders:
```sql
CREATE USER IF NOT EXISTS 'clerk'@'%' IDENTIFIED BY 'Pass@456';
GRANT SELECT, INSERT ON shop.orders TO 'clerk'@'%';
GRANT SELECT, INSERT ON shop.order_items TO 'clerk'@'%';
FLUSH PRIVILEGES;
```

---

## 4. Security Best Practices
- **Never commit active credentials**: Ensure `backend/.env` is included in `.gitignore`.
- **Parameterization**: Always utilize parameterized queries (which the backend enforces for all endpoints) to avoid SQL injection risks.
- **Port Isolation**: Ensure MySQL (port 3306) is bound to `127.0.0.1` and not exposed to the public internet without firewall rules.
