import subprocess
import os

os.chdir('C:/Users/rodion/WebstormProjects/shat_docs')

commits = [
    {
        'files': ['app/api/v1/groups/[id]/attendance/route.ts'],
        'message': '''API маршрут посещаемости: функция DELETE для удаления периода

- Добавлена поддержка HTTP DELETE метода
- Удаление по параметру periodMonth
- Валидация параметра перед удалением'''
    },
    {
        'files': ['app/api/v1/groups/[id]/grades/route.ts'],
        'message': '''API маршрут успеваемости: функция DELETE для удаления периода

- Добавлена поддержка HTTP DELETE метода
- Удаление по параметру periodSemester
- Валидация параметра перед удалением'''
    },
    {
        'files': ['utils/handlers.ts'],
        'message': '''Обработчики API: функции DeleteAttendancePeriod и DeleteGradesPeriod

- Добавлены функции для удаления периодов посещаемости и успеваемости
- Оптимизирована функция GetGrades с более читаемым кодом
- Правильная обработка URL параметров'''
    },
    {
        'files': ['app/profile/groups/[id]/page.tsx'],
        'message': '''Компонент группы: диалоги удаления вместо alert, новая архитектура

- Заменены window.confirm() на Radix Dialog компоненты
- Добавлены состояния showDeleteAttendanceDialog и showDeleteGradesDialog
- Новые функции openAttendanceDeleteDialog и openGradesDeleteDialog
- Рефактор логики загрузки/импорта в режимы import/load
- Улучшена видимость кнопок (скрыты/видны в зависимости от состояния)
- Добавлены комментарии к обработчикам на русском
- Упрощена логика работы с периодами'''
    }
]

for commit_info in commits:
    for file in commit_info['files']:
        subprocess.run(['git', 'add', file])
    subprocess.run(['git', 'commit', '-m', commit_info['message']])
    print(f"✓ Committed: {commit_info['message'].split(chr(10))[0]}")

# Push to remote
result = subprocess.run(['git', 'push', 'origin', 'main'])
if result.returncode == 0:
    print("\n✓ All changes pushed to remote")
else:
    print("\n✗ Error pushing to remote")
