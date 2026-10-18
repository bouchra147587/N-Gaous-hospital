-- Optional: the backend creates this table automatically on startup.
CREATE TABLE IF NOT EXISTS `department_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11) NOT NULL,
  `hero_image_url` varchar(500) DEFAULT NULL,
  `side_image_url` varchar(500) DEFAULT NULL,
  `about_image_url` varchar(500) DEFAULT NULL,
  `tag_ar` varchar(150) DEFAULT NULL, `tag_fr` varchar(150) DEFAULT NULL, `tag_en` varchar(150) DEFAULT NULL,
  `hero_subtitle_ar` text DEFAULT NULL, `hero_subtitle_fr` text DEFAULT NULL, `hero_subtitle_en` text DEFAULT NULL,
  `about_ar` text DEFAULT NULL, `about_fr` text DEFAULT NULL, `about_en` text DEFAULT NULL,
  `head_name_ar` varchar(255) DEFAULT NULL, `head_name_fr` varchar(255) DEFAULT NULL, `head_name_en` varchar(255) DEFAULT NULL,
  `floor_ar` varchar(255) DEFAULT NULL, `floor_fr` varchar(255) DEFAULT NULL, `floor_en` varchar(255) DEFAULT NULL,
  `services_json` text DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_id` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
