import swaggerJsdoc from 'swagger-jsdoc';

const getSwaggerOptions = (version: 'v1' | 'v2' = 'v1') => ({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shat Docs API',
      version: version === 'v1' ? '1.0.0' : '2.0.0',
      description: 'API документация для системы управления группами и студентами',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
      {
        url: '/api/v2',
        description: 'API v2 (планируется)',
      },
    ],
    components: {
      schemas: {
        Group: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID группы' },
            name: { type: 'string', description: 'Название группы' },
            fk_user: { type: 'number', description: 'ID учителя' },
            leader: { type: 'string', description: 'Лидер группы' },
            created_by: { type: 'string', description: 'Создано кем' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID студента' },
            full_name: { type: 'string', description: 'ФИО студента' },
            fk_group: { type: 'number', description: 'ID группы' },
          },
        },
        AttendanceStudent: {
          type: 'object',
          properties: {
            number: { type: 'string', description: 'Номер в списке' },
            fullName: { type: 'string', description: 'ФИО студента' },
            fullDaysTotal: { type: 'number', description: 'Всего полных дней' },
            fullDaysSick: { type: 'number', description: 'Полных дней по болезни' },
            lessonsTotal: { type: 'number', description: 'Всего уроков' },
            lessonsSick: { type: 'number', description: 'Уроков по болезни' },
            late: { type: 'number', description: 'Опозданий' },
            periodMonth: { type: 'number', description: 'Месяц периода' },
          },
        },
        GradeStudent: {
          type: 'object',
          properties: {
            fullName: { type: 'string', description: 'ФИО студента' },
            subjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Название предмета' },
                  grade: { type: 'string', description: 'Оценка' },
                },
              },
            },
            averageScore: { type: 'number', description: 'Средний балл' },
            periodSemester: { type: 'number', description: 'Полугодие' },
          },
        },
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID пользователя' },
            full_name: { type: 'string', description: 'ФИО пользователя' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID пользователя' },
            email: { type: 'string', description: 'Email пользователя' },
            full_name: { type: 'string', description: 'Полное имя пользователя' },
            created_by: { type: 'string', nullable: true, description: 'Кем создан пользователь' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Email пользователя' },
            password: { type: 'string', description: 'Пароль пользователя' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'full_name', 'password'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Email нового пользователя' },
            full_name: { type: 'string', description: 'Полное имя нового пользователя' },
            password: { type: 'string', description: 'Пароль пользователя' },
          },
        },
        SessionRequest: {
          type: 'object',
          required: ['uid', 'email', 'full_name'],
          properties: {
            uid: { type: 'number', description: 'ID пользователя' },
            email: { type: 'string', format: 'email', description: 'Email пользователя' },
            full_name: { type: 'string', description: 'Полное имя пользователя' },
          },
        },
        GroupForm: {
          type: 'object',
          required: ['name', 'fk_user'],
          properties: {
            name: { type: 'string', description: 'Название группы' },
            fk_user: { type: 'string', description: 'ID преподавателя' },
          },
        },
        StudentCreate: {
          type: 'object',
          required: ['fullName'],
          properties: {
            fullName: { type: 'string', description: 'ФИО студента' },
          },
        },
        StudentsCreateRequest: {
          type: 'object',
          required: ['students'],
          properties: {
            students: {
              type: 'array',
              items: { $ref: '#/components/schemas/StudentCreate' },
            },
          },
        },
        AttendanceCreateRequest: {
          type: 'object',
          required: ['groupId', 'students'],
          properties: {
            groupId: { type: 'number', description: 'ID группы' },
            students: {
              type: 'array',
              items: { $ref: '#/components/schemas/AttendanceStudent' },
            },
          },
        },
        GradeCreateRequest: {
          type: 'object',
          required: ['groupId', 'students'],
          properties: {
            groupId: { type: 'number', description: 'ID группы' },
            students: {
              type: 'array',
              items: { $ref: '#/components/schemas/GradeStudent' },
            },
          },
        },
        UpdateStudentRequest: {
          type: 'object',
          required: ['full_name'],
          properties: {
            full_name: { type: 'string', description: 'Новое ФИО студента' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            full_name: { type: 'string', description: 'Новое полное имя' },
            email: { type: 'string', format: 'email', description: 'Новый Email' },
            currentPassword: { type: 'string', description: 'Текущий пароль' },
            newPassword: { type: 'string', description: 'Новый пароль' },
            confirmPassword: { type: 'string', description: 'Подтверждение нового пароля' },
          },
        },
        UserStats: {
          type: 'object',
          properties: {
            groups: { type: 'number', description: 'Количество групп' },
            students: { type: 'number', description: 'Количество студентов' },
            avgGrade: { type: 'string', description: 'Средний балл' },
            attendance: {
              type: 'object',
              properties: {
                total: { type: 'number', description: 'Всего уроков' },
                sick: { type: 'number', description: 'Уроков по болезни' },
                late: { type: 'number', description: 'Опозданий' },
                percent: { type: 'number', description: 'Процент посещаемости' },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Успех операции' },
            message: { type: 'string', description: 'Информационное сообщение' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Успех операции' },
            message: { type: 'string', description: 'Сообщение об ошибке' },
            error: { type: 'string', description: 'Детали ошибки' },
          },
        },
      },
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
          description: 'Session-based authentication',
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
  },
  apis: [
    './app/api/v1/**/route.ts',
    './lib/swagger-paths.ts',
  ],
});

export const swaggerSpecV1 = swaggerJsdoc(getSwaggerOptions('v1'));
export const swaggerSpecV2 = swaggerJsdoc(getSwaggerOptions('v2'));

// For backwards compatibility
export const swaggerSpec = swaggerSpecV1;
