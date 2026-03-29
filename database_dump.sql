-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:3306
-- Время создания: Мар 29 2026 г., 20:58
-- Версия сервера: 8.0.45-0ubuntu0.24.04.1
-- Версия PHP: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `shat_docs`
--

-- --------------------------------------------------------

--
-- Структура таблицы `attendance`
--

CREATE TABLE `attendance` (
  `id` int NOT NULL,
  `fk_group` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_days_total` int DEFAULT '0',
  `full_days_sick` int DEFAULT '0',
  `lessons_total` int DEFAULT '0',
  `lessons_sick` int DEFAULT '0',
  `late` int DEFAULT '0',
  `period_month` tinyint(1) unsigned DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `attendance`
--

INSERT INTO `attendance` (`id`, `fk_group`, `full_name`, `full_days_total`, `full_days_sick`, `lessons_total`, `lessons_sick`, `late`, `updated_at`) VALUES
(1, 17, 'Гагарский М.', 12, 1, 59, 4, 1, '2026-02-24 10:48:59'),
(2, 17, 'Гнатюк А.', 0, 1, 0, 4, 2, '2026-02-24 10:48:59'),
(3, 17, 'Кермич Д.', 0, 1, 1, 3, 0, '2026-02-24 10:48:59'),
(4, 17, 'Колтаков П.', 3, 1, 21, 3, 7, '2026-02-24 10:48:59'),
(5, 17, 'Огурцов А.', 0, 1, 6, 3, 4, '2026-02-24 10:48:59'),
(6, 17, 'Чекмарёв М.', 1, 1, 25, 3, 8, '2026-02-24 10:48:59'),
(13, 20, 'Гагарский М.', 12, 0, 24, 0, 1, '2026-03-15 08:24:07'),
(14, 20, 'Гнатюк А.', 0, 0, 0, 0, 2, '2026-03-15 08:24:08'),
(15, 20, 'Кермич Д.', 0, 0, 1, 0, 0, '2026-02-24 12:17:48'),
(16, 20, 'Колтаков П.', 3, 0, 11, 5, 7, '2026-03-05 12:00:24'),
(17, 20, 'Огурцов А.', 0, 0, 6, 0, 4, '2026-02-24 12:17:48'),
(18, 20, 'Чекмарёв М.', 1, 4, 11, 1, 8, '2026-03-18 21:15:23');

-- --------------------------------------------------------

--
-- Структура таблицы `grades`
--

CREATE TABLE `grades` (
  `id` int NOT NULL,
  `fk_group` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `subjects_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `average_score` decimal(3,2) DEFAULT '0.00',
  `period_semester` tinyint(1) unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `grades`
--

INSERT INTO `grades` (`id`, `fk_group`, `full_name`, `subjects_json`, `average_score`, `updated_at`) VALUES
(1, 20, 'Гошев Родион Александрович', '[{\"name\":\"Графический Дизайн и мультмеди\",\"grade\":\"5\"},{\"name\":\"Иностранный язык в профессиона\",\"grade\":\"5\"},{\"name\":\"Менеджмент в профессиональной\",\"grade\":\"5\"},{\"name\":\"Обеспечение безопасности веб-п\",\"grade\":\"5\"},{\"name\":\"Оптимизациявеб-приложений\",\"grade\":\"5\"},{\"name\":\"Правовое обеспечение профессио\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ве\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ин\",\"grade\":\"5\"},{\"name\":\"Стандартизация сертификация и\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 02\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 03\",\"grade\":\"5\"},{\"name\":\"Физическаякультура\",\"grade\":\"5\"},{\"name\":\"Численныеметоды\",\"grade\":\"5\"},{\"name\":\"Экономикаотрасли\",\"grade\":\"5\"}]', 5.00, '2026-03-27 09:20:41'),
(2, 20, 'Грибов Дмитрий Викторович', '[{\"name\":\"Графический Дизайн и мультмеди\",\"grade\":\"4\"},{\"name\":\"Иностранный язык в профессиона\",\"grade\":\"5\"},{\"name\":\"Менеджмент в профессиональной\",\"grade\":\"5\"},{\"name\":\"Обеспечение безопасности веб-п\",\"grade\":\"4\"},{\"name\":\"Оптимизациявеб-приложений\",\"grade\":\"4\"},{\"name\":\"Правовое обеспечение профессио\",\"grade\":\"4\"},{\"name\":\"Проектирование и разработка ве\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ин\",\"grade\":\"4\"},{\"name\":\"Стандартизация сертификация и\",\"grade\":\"4\"},{\"name\":\"Учебнаяпрактика ПМ 02\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 03\",\"grade\":\"4\"},{\"name\":\"Физическаякультура\",\"grade\":\"4\"},{\"name\":\"Численныеметоды\",\"grade\":\"4\"},{\"name\":\"Экономикаотрасли\",\"grade\":\"4\"}]', 4.29, '2026-03-27 09:20:41'),
(3, 20, 'Ерёмин Тимур Рашидович', '[{\"name\":\"Графический Дизайн и мультмеди\",\"grade\":\"4\"},{\"name\":\"Иностранный язык в профессиона\",\"grade\":\"5\"},{\"name\":\"Менеджмент в профессиональной\",\"grade\":\"4\"},{\"name\":\"Обеспечение безопасности веб-п\",\"grade\":\"5\"},{\"name\":\"Оптимизациявеб-приложений\",\"grade\":\"4\"},{\"name\":\"Правовое обеспечение профессио\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ве\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ин\",\"grade\":\"4\"},{\"name\":\"Стандартизация сертификация и\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 02\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 03\",\"grade\":\"5\"},{\"name\":\"Физическаякультура\",\"grade\":\"5\"},{\"name\":\"Численныеметоды\",\"grade\":\"4\"},{\"name\":\"Экономикаотрасли\",\"grade\":\"4\"}]', 4.57, '2026-03-27 09:20:41'),
(4, 20, 'Литовченко Даниил Владимирович', '[{\"name\":\"Графический Дизайн и мультмеди\",\"grade\":\"4\"},{\"name\":\"Иностранный язык в профессиона\",\"grade\":\"5\"},{\"name\":\"Менеджмент в профессиональной\",\"grade\":\"5\"},{\"name\":\"Обеспечение безопасности веб-п\",\"grade\":\"4\"},{\"name\":\"Оптимизациявеб-приложений\",\"grade\":\"4\"},{\"name\":\"Правовое обеспечение профессио\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ве\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ин\",\"grade\":\"5\"},{\"name\":\"Стандартизация сертификация и\",\"grade\":\"4\"},{\"name\":\"Учебнаяпрактика ПМ 02\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 03\",\"grade\":\"4\"},{\"name\":\"Физическаякультура\",\"grade\":\"5\"},{\"name\":\"Численныеметоды\",\"grade\":\"4\"},{\"name\":\"Экономикаотрасли\",\"grade\":\"5\"}]', 4.57, '2026-03-27 09:20:42'),
(5, 20, 'Лысцев Виктор Александрович', '[{\"name\":\"Графический Дизайн и мультмеди\",\"grade\":\"4\"},{\"name\":\"Иностранный язык в профессиона\",\"grade\":\"4\"},{\"name\":\"Менеджмент в профессиональной\",\"grade\":\"5\"},{\"name\":\"Обеспечение безопасности веб-п\",\"grade\":\"4\"},{\"name\":\"Оптимизациявеб-приложений\",\"grade\":\"4\"},{\"name\":\"Правовое обеспечение профессио\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ве\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ин\",\"grade\":\"3\"},{\"name\":\"Стандартизация сертификация и\",\"grade\":\"4\"},{\"name\":\"Учебнаяпрактика ПМ 02\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 03\",\"grade\":\"4\"},{\"name\":\"Физическаякультура\",\"grade\":\"4\"},{\"name\":\"Численныеметоды\",\"grade\":\"4\"},{\"name\":\"Экономикаотрасли\",\"grade\":\"5\"}]', 4.29, '2026-03-27 09:20:42'),
(6, 20, 'Слобошевич Иван Андреевич', '[{\"name\":\"Графический Дизайн и мультмеди\",\"grade\":\"4\"},{\"name\":\"Иностранный язык в профессиона\",\"grade\":\"4\"},{\"name\":\"Менеджмент в профессиональной\",\"grade\":\"5\"},{\"name\":\"Обеспечение безопасности веб-п\",\"grade\":\"3\"},{\"name\":\"Оптимизациявеб-приложений\",\"grade\":\"4\"},{\"name\":\"Правовое обеспечение профессио\",\"grade\":\"4\"},{\"name\":\"Проектирование и разработка ве\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ин\",\"grade\":\"2\"},{\"name\":\"Стандартизация сертификация и\",\"grade\":\"4\"},{\"name\":\"Учебнаяпрактика ПМ 02\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 03\",\"grade\":\"2\"},{\"name\":\"Физическаякультура\",\"grade\":\"2\"},{\"name\":\"Численныеметоды\",\"grade\":\"3\"},{\"name\":\"Экономикаотрасли\",\"grade\":\"4\"}]', 3.64, '2026-03-27 09:20:42'),
(7, 20, 'Третьяков Александр Сергеевич', '[{\"name\":\"Графический Дизайн и мультмеди\",\"grade\":\"4\"},{\"name\":\"Иностранный язык в профессиона\",\"grade\":\"5\"},{\"name\":\"Менеджмент в профессиональной\",\"grade\":\"5\"},{\"name\":\"Обеспечение безопасности веб-п\",\"grade\":\"3\"},{\"name\":\"Оптимизациявеб-приложений\",\"grade\":\"5\"},{\"name\":\"Правовое обеспечение профессио\",\"grade\":\"4\"},{\"name\":\"Проектирование и разработка ве\",\"grade\":\"5\"},{\"name\":\"Проектирование и разработка ин\",\"grade\":\"4\"},{\"name\":\"Стандартизация сертификация и\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 02\",\"grade\":\"5\"},{\"name\":\"Учебнаяпрактика ПМ 03\",\"grade\":\"3\"},{\"name\":\"Физическаякультура\",\"grade\":\"4\"},{\"name\":\"Численныеметоды\",\"grade\":\"4\"},{\"name\":\"Экономикаотрасли\",\"grade\":\"5\"}]', 4.36, '2026-03-27 09:20:42');

-- --------------------------------------------------------

--
-- Структура таблицы `groups`
--

CREATE TABLE `groups` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fk_user` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `groups`
--

INSERT INTO `groups` (`id`, `name`, `created_by`, `fk_user`) VALUES
(17, '44РА', '2026-01-17 15:08:39', 27),
(18, '44В', '2026-01-17 15:11:09', 27),
(20, '34РА', '2026-02-24 11:42:24', 26),
(21, '34В', '2026-03-02 06:41:33', 28),
(22, '24В', '2026-03-02 07:06:00', 27),
(23, '24РА', '2026-03-02 07:06:10', 28),
(30, '2', '2026-03-05 11:24:37', 28),
(33, 'Ахаё родион', '2026-03-27 13:53:45', 29);

-- --------------------------------------------------------

--
-- Структура таблицы `students`
--

CREATE TABLE `students` (
  `id` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fk_group` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `students`
--

INSERT INTO `students` (`id`, `full_name`, `fk_group`) VALUES
(28, 'Иванов И.И.', 18),
(29, 'Иванов И.А.', 18),
(30, 'Иванов И.И.', 18),
(31, 'Иванов И.И.', 18),
(32, 'Иванов И.И.', 18),
(33, 'Иванов И.И.', 18),
(34, 'Иванов И.И.', 18),
(35, 'Иванов И.И.', 18),
(39, 'Иванов И.И.', 17),
(41, 'Гнатюк А.', 20),
(42, 'Кермич Д.', 20),
(43, 'Колтаков П.', 20),
(44, 'Огурцов А.', 20),
(45, 'Чекмарёв М.', 20),
(46, 'Гагарский М.', 20);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `email`, `full_name`, `password_hash`, `isAdmin`, `created_by`) VALUES
(26, 'rodionvarzymov@gmail.com', 'Гошев Родион', '$2b$10$Zr3oAJiIG71K9fJAmlZe2evL2UkJZBaBXEmPl3tgN2QW1BqA.1sKG', 0, '2026-01-16 11:19:30'),
(27, 'test@gmail.com', 'Иванов И.И.', '$2b$10$b6Co8G6/GHRvNXMSe25gjeIsX0AtUViQjqMEnOWzjg9yJ0J8HFw.e', 0, '2026-01-16 11:20:16'),
(28, 'gmail@gmail.com', 'Гошев Родион Александрович', '$2b$10$gGD10lbGuywz2J1uwgFfp.6Ul23cNMKprDt0vcSrqSGT1x21Y5INu', 0, '2026-02-27 06:35:58'),
(29, 'test@test.com', 'Xixu usn', '$2b$10$KxFWLyYvH3Wb8Z90FVQBaOtW8hBqV8WeTxMaHuP6vW.4wlQyOfJtO', 0, '2026-03-27 13:51:02'),
(30, 'savelybogatyryov@yandex.ru', 'Богатырев Савелий Юрьевич', '$2b$10$RyUAgg2v2ziLxX4A.1l7ZenbpKuXNrTYQ1U3etVWhIAnaByey5gzO', 0, '2026-03-27 20:02:20');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_attendance` (`fk_group`,`full_name`) USING BTREE;

--
-- Индексы таблицы `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `group_student` (`fk_group`,`full_name`) USING BTREE;

--
-- Индексы таблицы `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user` (`fk_user`) USING BTREE;

--
-- Индексы таблицы `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_group` (`fk_group`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=133;

--
-- AUTO_INCREMENT для таблицы `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT для таблицы `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT для таблицы `students`
--
ALTER TABLE `students`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_attendance_group` FOREIGN KEY (`fk_group`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `grades`
--
ALTER TABLE `grades`
  ADD CONSTRAINT `fk_grades_group` FOREIGN KEY (`fk_group`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `groups`
--
ALTER TABLE `groups`
  ADD CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`fk_user`) REFERENCES `users` (`id`);

--
-- Ограничения внешнего ключа таблицы `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`fk_group`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
