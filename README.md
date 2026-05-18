# SHAT Docs

Система создания и управления документацией для техникума: посещаемость, успеваемость, отчёты и справки для студентов.

**Текущая версия:** `2.0.0-beta1` (ветка v2.X).  
Исходный код основан на [FoxWorldWeb](https://github.com/PWNight/FoxWorldWeb).

Документация в приложении: `/wiki` · Сравнение v1 и v2: `/wiki/versions-v1-v2`

## Требования

- Node.js 20+
- npm

## Быстрый старт

```bash
npm install
cp .env.example .env   # или создайте .env вручную
npm run dev
```

Приложение: [http://localhost:3000](http://localhost:3000)

## Переменные окружения

Создайте файл `.env`:

```env
SESSION_SECRET=""      # Секрет для подписи JWT-сессии (обязательно)
ROOT_EMAIL=""          # Почта root-пользователя (обязательно в production)
ROOT_NAME=""           # Имя root-пользователя
ROOT_PASSWORD=""       # Пароль root-пользователя

# Необязательно: путь к SQLite (по умолчанию ./data/shat_docs.sqlite)
# SQLITE_PATH="C:\\path\\to\\shat_docs.sqlite"
```

## Скрипты

| Команда | Описание |
| --- | --- |
| `npm run dev` | Dev-сервер Next.js |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Проверка TypeScript |
| `npm run test` | Vitest (unit-тесты) |
| `npm run backup:db` | Резервная копия SQLite |

## Health-check

```bash
curl http://localhost:3000/api/health
```

Ответ `200` — приложение и БД доступны; `503` — БД offline.

## База данных

- SQLite, файл по умолчанию: `data/shat_docs.sqlite`
- WAL-режим, миграции применяются автоматически при старте (`schema_migrations`)
- Рекомендуется регулярный backup: `npm run backup:db`

## CI

GitHub Actions (`.github/workflows/ci.yml`): typecheck → lint → test → build.

## Wiki

| Раздел | Путь |
| --- | --- |
| Оглавление | `/wiki` |
| Быстрый старт | `/wiki/quick-start` |
| API Reference (v3) | `/wiki/api-reference` |
| API v2 vs v3 | `/wiki/api-v2-v3` |

## Лицензия

Private project.
