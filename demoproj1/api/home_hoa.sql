-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 08, 2024 at 03:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blogs`
--

INSERT INTO `blogs` (`id`, `title`, `image`, `description`) VALUES
(1, 'Fiesta is all around the corner of castillejos', 'https://s.hdnux.com/photos/45/31/21/9802824/12/rawImage.jpg', 'Dancing, Singing while patronizing saints'),
(2, 'Blog 1', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max', 'Sun Flowers'),
(3, 'Blog 2', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max', 'fluwers');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  'end_time' time NOT NULL,
  `location` varchar(255) NOT NULL,
  `attendees` int(11) DEFAULT 0,
  `status` enum('Upcoming','Completed','Pending') NOT NULL DEFAULT 'Upcoming',
  `image` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `title`, `image`, `description`) VALUES
(1, 'Fiesta is all around the corner of castillejos', 'https://s.hdnux.com/photos/45/31/21/9802824/12/rawImage.jpg', 'Dancing, Singing while patronizing saints'),
(2, 'Event 2', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max', 'Sun Flowers'),
(3, 'Event 2', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max', 'Sun Flowers'),
(4, 'Event 3', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max', 'Flowers');

-- Add sample upcoming events
INSERT INTO `events` (`title`, `description`, `date`, `time`, `location`, `status`) VALUES
('Monthly HOA meeting', 'Regular monthly meeting', '2024-11-15', '08:00:00', 'Community Hall', 'Upcoming'),
('Community Cleanup Day', 'Community cleanup activity', '2024-11-12', '09:00:00', 'Main Park', 'Upcoming'),
('Pool Maintenance', 'Regular pool maintenance', '2024-11-10', '08:00:00', 'Swimming Pool', 'Upcoming');

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `news`
--

INSERT INTO `news` (`id`, `title`, `image`, `description`) VALUES
(1, 'Fiesta is all around the corner of castillejos', 'Image1.jpg', 'Dancing, Singing while patronizing saints'),
(2, 'Fiesta is all around the corner of castillejos', 'https://s.hdnux.com/photos/45/31/21/9802824/12/rawImage.jpg', 'Dancing, Singing while patronizing saints'),
(3, 'News 1', 'https://gttp.imgix.net/282206/x/0/pictures-of-festivals-in-the-philippines-1.jpg?auto=compress%2Cformat&ch=Width%2CDPR&dpr=1&ixlib=php-3.3.0', 'desxc'),
(4, 'News 1', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max', 'Sun Flowers'),
(5, 'News 3', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max', 'Flowers');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `prop_id` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `prop_name` varchar(255) NOT NULL,
  `prop_address` varchar(255) NOT NULL,
  `prop_size` varchar(50) NOT NULL,
  `prop_rooms` varchar(50) NOT NULL,
  `prop_status` varchar(50) NOT NULL,
  `prop_price` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`prop_id`, `image`, `prop_name`, `prop_address`, `prop_size`, `prop_rooms`, `prop_status`, `prop_price`, `created_at`) VALUES
(1, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCALQBQADASIAAhEB', 'Home 1', '11 Address', '123456', '1 bed, 1 bath', 'For Sale', '123,123', '2024-12-02 16:55:38'),
(19, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gJASUNDX1BST0ZJTEUAAQEAAAIwQURCRQIQAABtbnRyUkdCIFhZWiAH0AAIAAsAEwAzADthY3NwQVBQTAAAAABub25lAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLUFEQkUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApjcHJ0', '18,,,,', '18th street', '234567890', '1 bed, 1 bath', 'For Sale', '12345678', '2024-12-05 17:29:35'),
(21, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wgARCAjJBdwDASIAAhEB', ' csdm sdcs', '12 sjhdbvjv', '12243', '2 bed 2 vbath', 'For Sale', '2232,434', '2024-12-08 09:24:25'),
(22, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAcHBwcIBwgJCQgMDAsMDBEQDg4QERoSFBIUEhonGB0YGB0YJyMqIiAiKiM+MSsrMT5IPDk8SFdOTldtaG2Pj8ABBwcHBwgHCAkJCAwMCwwMERAODhARGhIUEhQSGicYHRgYHRgnIyoiICIqIz4xKysxPkg8OTxIV05OV21obY+PwP/CABEICQwMEAMBIgACEQEDEQH/', 'CCS Faculty', '12st. Gordon College', '400', '1 bed, 1 bath', 'Rented', '44,000', '2024-12-08 09:31:52');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password`) VALUES
(1, 'jojo', 'jojo@gmail.com', '$2y$10$GHhLfimwjLYJGLaawy8g/OVqLYkmEl.QZ88mNmqw3.AZxE/qQPRoC');

-- --------------------------------------------------------

--
-- Table structure for table `vlogs`
--

CREATE TABLE `vlogs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `thumbnailUrl` varchar(255) NOT NULL,
  `shortDescription` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vlogs`
--

INSERT INTO `vlogs` (`id`, `title`, `thumbnailUrl`, `shortDescription`) VALUES
(1, 'Fiesta is all around the corner of castillejos', 'https://www.youtube.com/watch?v=IkEG7-O-uNs', 'Dancing, Singing while patronizing saints'),
(2, 'raffy tulfo', 'https://www.youtube.com/watch?v=IkEG7-O-uNs', 'laban');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `unit` varchar(50) NOT NULL,
  `resident_name` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('Paid','Pending','Overdue') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`date`, `unit`, `resident_name`, `amount`, `status`) VALUES
('2024-11-12', 'Blk. 20 Lot 4', 'Lee Leighnard Jose', 6000.00, 'Paid'),
('2024-11-12', 'Blk. 12 Lot 7', 'Janna Rolls', 6000.00, 'Pending'),
('2024-11-12', 'Blk. 5 Lot 14', 'John Doe', 6000.00, 'Overdue');

-- --------------------------------------------------------

--
-- Table structure for table `residents`
--

CREATE TABLE `residents` (
  `resident_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `status` enum('Active','Pending') NOT NULL DEFAULT 'Pending',
  `move_in_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `property_id` int(11) NOT NULL,
  PRIMARY KEY (`resident_id`),
  CONSTRAINT `fk_property` FOREIGN KEY (`property_id`) REFERENCES `properties`(`prop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `maintenance`
--

CREATE TABLE `maintenance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image` varchar(255) NOT NULL,
  `Address` varchar(50) NOT NULL,
  `resident_name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  `priority` enum('Low','Medium','High') NOT NULL,
  `request_date` date NOT NULL,
  `assigned_to` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Add documents table
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `type` enum('Policy','Rule','Form','Archived') NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp(),
  `size` int(11) NOT NULL,
  `views` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add payment_trends table
CREATE TABLE `payment_trends` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `month` varchar(10) NOT NULL,
  `year` int(11) NOT NULL,
  `collections` decimal(10,2) NOT NULL,
  `outstanding` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add sample data
INSERT INTO `payment_trends` (`month`, `year`, `collections`, `outstanding`) VALUES
('Jan', 2024, 65000.00, 28000.00),
('Feb', 2024, 59000.00, 48000.00),
('Mar', 2024, 80000.00, 40000.00),
('Apr', 2024, 81000.00, 19000.00),
('May', 2024, 56000.00, 86000.00),
('Jun', 2024, 55000.00, 27000.00);

-- Add maintenance_requests table if not exists
CREATE TABLE IF NOT EXISTS `maintenance_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('Open','In Progress','Completed') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add some sample maintenance requests
INSERT INTO `maintenance_requests` (`status`, `created_at`, `completed_at`) VALUES
('Open', NOW() - INTERVAL 2 DAY, NULL),
('In Progress', NOW() - INTERVAL 3 DAY, NULL),
('Completed', NOW() - INTERVAL 1 DAY, NOW());

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`prop_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `vlogs`
--
ALTER TABLE `vlogs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `prop_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vlogs`
--
ALTER TABLE `vlogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
