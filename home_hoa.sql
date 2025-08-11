-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2025 at 07:14 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `home_hoa`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `admin_code` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `username`, `email`, `password`, `admin_code`) VALUES
(1, 'loulou', 'louis@gmail.com', '$2y$10$RIanZBWBcWyiVqREN5OQrOhghwa.wo48Q/0k6iAdmtQMhwlchyA6u', 'Admin Code'),
(2, 'louisjohn', 'louisjohn@gmail.com', '$2y$10$BMvMq1BBPrdk0Y4WAQ6aCeW6a3uUO4YYQFGnimm/qQrwr25WZ.vrK', 'Admin Code'),
(3, 'admin', 'adminhehe@gmail.com', '$2y$10$oXvx/b4wh2Br3AAsv4rQQO.lZyDB88l7ILk4g3Qn7BH1wYH.Ms/wu', 'Admin Code'),
(4, 'Jomarie Del Rosario', 'jojodr@gmail.com', '$2y$10$Ufrjlx/dUPCVc1y1Zfvq2ehCH8rEikWXpERkSSc/tmx1ZToXgGrWa', 'Admin Code');

-- --------------------------------------------------------

--
-- Table structure for table `class_routines`
--

CREATE TABLE `class_routines` (
  `class_id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `class_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `mondayRoutine` text DEFAULT NULL,
  `mondayintensity` varchar(32) DEFAULT NULL,
  `tuesdayRoutine` text DEFAULT NULL,
  `tuesdayintensity` varchar(32) DEFAULT NULL,
  `wednesdayRoutine` text DEFAULT NULL,
  `wednesdayintensity` varchar(32) DEFAULT NULL,
  `thursdayRoutine` text DEFAULT NULL,
  `thursdayintensity` varchar(32) DEFAULT NULL,
  `fridayRoutine` text DEFAULT NULL,
  `fridayintensity` varchar(32) DEFAULT NULL,
  `saturdayRoutine` text DEFAULT NULL,
  `saturdayintensity` varchar(32) DEFAULT NULL,
  `sundayRoutine` text DEFAULT NULL,
  `sundayintensity` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `codegen`
--

CREATE TABLE `codegen` (
  `code_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `student_redeemer` varchar(255) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `location` varchar(255) NOT NULL,
  `attendees` int(11) DEFAULT 0,
  `status` enum('Upcoming','Completed','Pending') NOT NULL DEFAULT 'Upcoming',
  `image` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `title`, `description`, `date`, `time`, `location`, `attendees`, `status`, `image`, `created_at`, `updated_at`) VALUES
(2, 'Belated Merry Xmas', 'ascvghsjhbkcjsdbvsdkvsd', '2025-01-02', '16:38:00', 'Castillejos', 0, 'Upcoming', '6775616b79f01_d0b2cb9c49eacd1b35f543fb134ff07c.jpg', '2025-01-01 15:38:19', '2025-01-01 15:38:19'),
(8, 'Community Clean-Up Day', 'Join us for a Community Clean-Up Day on January 15th! Let\'s come together to make our neighborhood cleaner and greener.', '2025-01-15', '08:00:00', 'Castillejos', 0, 'Upcoming', '6777ccfa0fb40_4kskskksk.jpg', '2025-01-03 11:41:46', '2025-01-03 11:41:46');

-- --------------------------------------------------------

--
-- Table structure for table `hoa_admins`
--

CREATE TABLE `hoa_admins` (
  `admin_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `admin_code` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hoa_admins`
--

INSERT INTO `hoa_admins` (`admin_id`, `username`, `email`, `password`, `admin_code`) VALUES
(1, 'rei@gmail.com', '123456789', '$2y$10$MJSmLuszRc990YdRhPjWGOIsDLbew.NVHwU3qEwxOXvrA6qrLcIpO', 'admin_677656d5429b6'),
(2, 'admin1', 'admin1@gmail.com', '$2y$10$lYpcPArDJw8nkaRo01K3WOzDC14UO/..PzGsFZpCTR9PwYhrjgNMK', 'admin_6776584cc4b20'),
(3, 'Jomarie DD', 'jomar@gmail.com', '$2y$10$rh3hOVf/KkwuV1hrf2UTNefHSdDI/eThHnmqlw.wa9xDoZGJvxcL6', 'admin_677c21d78111f'),
(4, 'denise punzalan', 'CCS@gmail.com', '$2y$10$qc8rHQ2Q/nOTeFIMzi.K1.d47h7BYyWxUlCc.G4PSHoFo5Tm/Un6K', 'admin_677d2c26af3c3'),
(5, 'admintest', 'testing@gmail.com', '$2y$10$o4/6uPph.ikcSHZ2c1tLfuIh1uLfm7W7PwKtez4vMpxQ5AFuDOkDe', 'admin_6842ed3f12442');

-- --------------------------------------------------------

--
-- Table structure for table `hoa_users`
--

CREATE TABLE `hoa_users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hoa_users`
--

INSERT INTO `hoa_users` (`user_id`, `username`, `email`, `password`) VALUES
(1, 'rei@gmail.com', '123456789', '$2y$10$tPDcvqLJdwx5JFcCIylyUeCPYxyQFIO25qtfXQZnsPORyBuLnxiGK'),
(2, 'james', 'jameskes@gmail.com', '$2y$10$nK4DqaJIgTnycfv8fsEBS.fw/dgxnKXSMbHhKyHhXDvLxwCsAh0lC'),
(3, 'admin1', 'admin1@gmail.com', '$2y$10$ywfjhUXqjoBYZ4WgP/o.bO3EnOjfZfQ9eO8TdAcaSQxbcYoxfKUwe'),
(27, 'Min Yoon Gi', 'suga@gmail.com', '$2y$10$Fzh3CUA1Z.LPiM9HBWcid./iIUjg7ld5tbd0fk2u1.ZLno0CsTP4u'),
(28, 'jomarie del rosario', 'jomariedr@gmail.com', '$2y$10$U5DBKc1MPpLCJihm3sQobuMckwS/Z8/6XUT72rHWVoYezrOFHgbE.'),
(29, 'test1', 'testing@gmail.com', '$2y$10$ym/YowmXbSIo0XTyxNkGducSZp6tCuB7/toyUwaVwA4eW7h23M1yS'),
(30, 'test2', 'testing1@gmail.com', '$2y$10$iY3mrjtFjsoHN8TMouduKOGxM8vJiu71sASxj7TzbGAKmdAJ8Yrtu');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_user_id` int(11) DEFAULT NULL,
  `sender_admin_id` int(11) DEFAULT NULL,
  `sender_type` enum('user','vendor') NOT NULL,
  `recipient_user_id` int(11) DEFAULT NULL,
  `recipient_admin_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_user_id`, `sender_admin_id`, `sender_type`, `recipient_user_id`, `recipient_admin_id`, `message`, `created_at`) VALUES
(18, NULL, 5, '', 1, NULL, 'Hello!', '2025-01-03 08:50:31'),
(19, NULL, 5, '', 1, NULL, 'Hello!', '2025-01-03 08:50:50'),
(28, 2, NULL, 'user', NULL, 4, 'sadasfasd', '2025-01-05 16:01:37'),
(30, 3, NULL, 'user', NULL, 1, 'dvdsfbdfbdfgbsdbsfbsdbdsa', '2025-01-05 17:52:13'),
(32, 3, NULL, 'user', NULL, 2, 'anong ginagawa mo?', '2025-01-06 18:29:10'),
(33, 2, NULL, 'user', NULL, 2, 'deliver this message!', '2025-01-07 12:37:13'),
(34, 4, NULL, 'user', 1, NULL, 'asdfggh', '2025-01-07 12:39:40'),
(35, 2, NULL, 'user', NULL, 2, 'hello', '2025-01-08 15:32:10'),
(36, 4, NULL, 'user', NULL, 2, 'amgsend ka naman', '2025-01-08 15:32:35'),
(37, 2, NULL, 'user', NULL, 2, 'hilu', '2025-01-08 18:49:39'),
(38, NULL, 2, '', 2, NULL, 'babalik sayo to', '2025-01-08 18:50:19'),
(39, NULL, 2, '', 3, NULL, 'hi', '2025-02-13 09:04:07'),
(40, 3, NULL, 'user', NULL, 2, 'hello coach', '2025-04-06 16:38:51'),
(41, 3, NULL, 'user', 28, NULL, 'example', '2025-04-06 20:17:18');

-- --------------------------------------------------------

--
-- Table structure for table `task`
--

CREATE TABLE `task` (
  `task_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date_due` date DEFAULT NULL,
  `time_due` time DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tripping_request`
--

CREATE TABLE `tripping_request` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `