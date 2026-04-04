#!/bin/bash
cd "C:/Users/rodion/WebstormProjects/shat_docs"

# Commit attendance route changes
git add "app/api/v1/groups/[id]/attendance/route.ts"
git commit -m "API маршрут посещаемости: функция DELETE для удаления периода

- Добавлена поддержка HTTP DELETE метода
- Удаление по параметру periodMonth
- Валидация параметра перед удалением"

# Commit grades route changes
git add "app/api/v1/groups/[id]/grades/route.ts"
git commit -m "API маршрут успеваемости: функция DELETE для удаления периода

- Добавлена поддержка HTTP DELETE метода
- Удаление по параметру periodSemester
- Валидация параметра перед удалением"

# Commit handlers changes
git add "utils/handlers.ts"
git commit -m "Обработчики API: функции DeleteAttendancePeriod и DeleteGradesPeriod

- Добавлены функции для удаления периодов посещаемости и успеваемости
- Оптимизирована функция GetGrades с более читаемым кодом
- Правильная обработка URL параметров"

# Commit page component changes
git add "app/profile/groups/[id]/page.tsx"
git commit -m "Компонент группы: диалоги удаления вместо alert, новая архитектура

- Заменены window.confirm() на Radix Dialog компоненты
- Добавлены состояния showDeleteAttendanceDialog и showDeleteGradesDialog
- Новые функции openAttendanceDeleteDialog и openGradesDeleteDialog
- Рефактор логики загрузки/импорта в режимы import/load
- Улучшена видимость кнопок (скрыты/видны в зависимости от состояния)
- Добавлены комментарии к обработчикам на русском
- Упрощена логика работы с периодами"

# Push all commits
git push origin main
