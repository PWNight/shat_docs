/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Вход в систему
 *     description: Аутентификация пользователя по email и паролю.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успшный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: number
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неверные учетные данные
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Регистрация пользователя
 *     description: Создание нового аккаунта.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: number
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Пользователь уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Выход из системы
 *     description: Завершение пользовательской сессии.
 *     responses:
 *       200:
 *         description: Успешный выход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Пользователь не авторизован
 *       422:
 *         description: Некорректный токен
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /auth/create-session:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Создание сессии
 *     description: Инициация сессии пользователя после успешного входа.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionRequest'
 *     responses:
 *       200:
 *         description: Сессия создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /groups:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Получить все группы
 *     description: Вернуть список групп с информацией о лидере.
 *     responses:
 *       200:
 *         description: Список групп
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 *   post:
 *     tags:
 *       - Groups
 *     summary: Создать группу
 *     description: Создание новой группы с указанием преподавателя.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GroupForm'
 *     responses:
 *       200:
 *         description: Группа создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Ошибка валидации или группа уже существует
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Получить группу
 *     description: Получить данные группы по ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID группы
 *     responses:
 *       200:
 *         description: Данные группы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Группа не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 *   post:
 *     tags:
 *       - Groups
 *     summary: Обновить группу
 *     description: Обновление данных группы по ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GroupForm'
 *     responses:
 *       200:
 *         description: Группа обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Ошибка валидации или отсутствие изменений
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет доступа к обновлению группы
 *       404:
 *         description: Группа не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Удалить группу
 *     description: Удаление группы по ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Группа удалена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет доступа к удалению группы
 *       404:
 *         description: Группа не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /groups/{id}/attendance:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Получить посещаемость
 *     description: Получить массив посещаемости для группы.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID группы
 *       - in: query
 *         name: periodMonth
 *         schema:
 *           type: number
 *         description: Номер месяца (1-12)
 *     responses:
 *       200:
 *         description: Данные посещаемости
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AttendanceStudent'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 *   post:
 *     tags:
 *       - Attendance
 *     summary: Сохранить посещаемость
 *     description: Загрузить данные посещаемости для группы.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceCreateRequest'
 *     responses:
 *       200:
 *         description: Данные записаны
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 *   delete:
 *     tags:
 *       - Attendance
 *     summary: Удалить записи посещаемости
 *     description: Удалить записи посещаемости группы за указанный месяц.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: periodMonth
 *         required: true
 *         schema:
 *           type: number
 *         description: Номер месяца для удаления
 *     responses:
 *       200:
 *         description: Записи удалены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Не указан период для удаления
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /groups/{id}/grades:
 *   get:
 *     tags:
 *       - Grades
 *     summary: Получить оценки
 *     description: Получить оценки по группе.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID группы
 *       - in: query
 *         name: periodSemester
 *         schema:
 *           type: number
 *         description: Номер полугодия (1-2)
 *     responses:
 *       200:
 *         description: Данные оценок
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GradeStudent'
 *       500:
 *         description: Внутренняя ошибка сервера
 *   post:
 *     tags:
 *       - Grades
 *     summary: Сохранить оценки
 *     description: Загрузить данные оценок для группы.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GradeCreateRequest'
 *     responses:
 *       200:
 *         description: Данные записаны
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *   delete:
 *     tags:
 *       - Grades
 *     summary: Удалить оценки
 *     description: Удалить оценки группы за указанное полугодие.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: periodSemester
 *         required: true
 *         schema:
 *           type: number
 *         description: Номер полугодия для удаления
 *     responses:
 *       200:
 *         description: Записи удалены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Не указан период для удаления
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /groups/{id}/students:
 *   get:
 *     tags:
 *       - Students
 *     summary: Получить студентов
 *     description: Список студентов указанной группы.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID группы
 *     responses:
 *       200:
 *         description: Список студентов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 *   post:
 *     tags:
 *       - Students
 *     summary: Добавить студентов
 *     description: Создать или обновить студентов для группы.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentsCreateRequest'
 *     responses:
 *       201:
 *         description: Студенты добавлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Неверный формат данных
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /groups/{id}/students/{studentId}:
 *   patch:
 *     tags:
 *       - Students
 *     summary: Обновить студента
 *     description: Обновление ФИО студента в группе.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStudentRequest'
 *     responses:
 *       200:
 *         description: Студент обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Новое имя не указано
 *       404:
 *         description: Студент не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 *   delete:
 *     tags:
 *       - Students
 *     summary: Удалить студента
 *     description: Удаление студента и связанных данных.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Студент удален
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Студент не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получить пользователей
 *     description: Получить список всех пользователей.
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserSummary'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 *   post:
 *     tags:
 *       - Users
 *     summary: Обновить профиль пользователя
 *     description: Обновление данных профиля и пароля.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Профиль обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Ошибка валидации или неверные данные
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получить пользователя
 *     description: Получить профиль пользователя по ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /users/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получить статистику пользователя
 *     description: Статистика по группам, студентам и посещаемости для текущего пользователя.
 *     responses:
 *       200:
 *         description: Статистика пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */

export {};
