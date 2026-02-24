-- phpMyAdmin SQL Dump
-- version 5.2.3-1.fc43
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Фев 24 2026 г., 12:32
-- Версия сервера: 10.11.15-MariaDB
-- Версия PHP: 8.4.18

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
  `id` int(11) NOT NULL,
  `fk_group` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `full_days_total` int(11) DEFAULT 0,
  `full_days_sick` int(11) DEFAULT 0,
  `lessons_total` int(11) DEFAULT 0,
  `lessons_sick` int(11) DEFAULT 0,
  `late` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
(13, 20, 'Гагарский М.', 12, 0, 62, 0, 1, '2026-02-24 12:17:48'),
(14, 20, 'Гнатюк А.', 0, 0, 0, 0, 2, '2026-02-24 12:17:48'),
(15, 20, 'Кермич Д.', 0, 0, 1, 0, 0, '2026-02-24 12:17:48'),
(16, 20, 'Колтаков П.', 3, 0, 21, 0, 7, '2026-02-24 12:17:48'),
(17, 20, 'Огурцов А.', 0, 0, 6, 0, 4, '2026-02-24 12:17:48'),
(18, 20, 'Чекмарёв М.', 1, 0, 25, 0, 8, '2026-02-24 12:17:48');

-- --------------------------------------------------------

--
-- Структура таблицы `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_by` timestamp NOT NULL DEFAULT current_timestamp(),
  `fk_user` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `groups`
--

INSERT INTO `groups` (`id`, `name`, `created_by`, `fk_user`) VALUES
(17, '44РА', '2026-01-17 15:08:39', 27),
(18, '44В', '2026-01-17 15:11:09', 27),
(20, '34В', '2026-02-24 11:42:24', 26);

-- --------------------------------------------------------

--
-- Структура таблицы `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `fk_group` int(11) NOT NULL
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
(39, 'Иванов И.И.', 17);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(500) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password_hash` varchar(500) NOT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `email`, `full_name`, `password_hash`, `isAdmin`, `created_by`) VALUES
(26, 'rodionvarzymov@gmail.com', 'Родион Гошев', '$2b$10$9OxoqDa19NcdQobFIJZmKu0XrhU81rrMceOMsh3yJ90NFee2Jer5C', 0, '2026-01-16 11:19:30'),
(27, 'test@gmail.com', 'Иванов И.И.', '$2b$10$b6Co8G6/GHRvNXMSe25gjeIsX0AtUViQjqMEnOWzjg9yJ0J8HFw.e', 0, '2026-01-16 11:20:16');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_attendance` (`fk_group`,`full_name`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT для таблицы `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT для таблицы `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_attendance_group` FOREIGN KEY (`fk_group`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

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
