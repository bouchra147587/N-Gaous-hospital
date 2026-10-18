-- Administration section (run once in phpMyAdmin; the backend also auto-creates these tables on startup)
CREATE TABLE IF NOT EXISTS `administration_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eyebrow_ar` varchar(255) DEFAULT NULL, `eyebrow_fr` varchar(255) DEFAULT NULL, `eyebrow_en` varchar(255) DEFAULT NULL,
  `title_ar` varchar(255) DEFAULT NULL, `title_fr` varchar(255) DEFAULT NULL, `title_en` varchar(255) DEFAULT NULL,
  `subtitle_ar` text DEFAULT NULL, `subtitle_fr` text DEFAULT NULL, `subtitle_en` text DEFAULT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `administration_offices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title_ar` varchar(255) NOT NULL, `title_fr` varchar(255) DEFAULT NULL, `title_en` varchar(255) DEFAULT NULL,
  `description_ar` text DEFAULT NULL, `description_fr` text DEFAULT NULL, `description_en` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `administration_directors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name_ar` varchar(255) NOT NULL, `name_fr` varchar(255) DEFAULT NULL, `name_en` varchar(255) DEFAULT NULL,
  `position_ar` varchar(255) DEFAULT NULL, `position_fr` varchar(255) DEFAULT NULL, `position_en` varchar(255) DEFAULT NULL,
  `badge_ar` varchar(255) DEFAULT NULL, `badge_fr` varchar(255) DEFAULT NULL, `badge_en` varchar(255) DEFAULT NULL,
  `description_ar` text DEFAULT NULL, `description_fr` text DEFAULT NULL, `description_en` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Starter content (matches the design; edit or delete from the admin panel)
INSERT INTO `administration_settings` (`eyebrow_ar`,`eyebrow_fr`,`eyebrow_en`,`title_ar`,`title_fr`,`title_en`,`subtitle_ar`,`subtitle_fr`,`subtitle_en`,`is_visible`) VALUES
('الإدارة','Direction','Administration','إدارة المستشفى','Direction de l''hôpital','Hospital Administration',
 'فريق إداري ملتزم بتقديم أفضل الخدمات الصحية لمرضانا','Une équipe administrative engagée à offrir les meilleurs services de santé à nos patients','An administrative team committed to delivering the best healthcare services to our patients',1);

INSERT INTO `administration_directors` (`name_ar`,`name_fr`,`name_en`,`position_ar`,`position_fr`,`position_en`,`badge_ar`,`badge_fr`,`badge_en`,`description_ar`,`description_fr`,`description_en`,`icon`,`is_featured`,`display_order`) VALUES
('د. أحمد بن سالم','Dr Ahmed Ben Salem','Dr. Ahmed Ben Salem','مدير المستشفى','Directeur de l''hôpital','Hospital Director','المدير العام','Directeur général','General Director','يتولى المدير العام الإشراف على تسيير المستشفى وضمان حسن سير المرافق الصحية وتطوير الخدمات الطبية.','Le directeur général supervise la gestion de l''hôpital, assure le bon fonctionnement des structures de santé et développe les services médicaux.','The General Director oversees hospital management, ensures the smooth running of health facilities and develops medical services.','user',1,1),
('د. كريم لعمري','Dr Karim Laamri','Dr. Karim Laamri','','','','النائب المكلف بالمصالح الطبية','Sous-directeur des services médicaux','Deputy for Medical Services','يشرف على تسيير المصالح الطبية والصحية والتجهيزات الطبية لضمان استمرارية عمل المستشفى.','Supervise la gestion des services médicaux et des équipements pour assurer la continuité du fonctionnement de l''hôpital.','Oversees medical services and equipment to ensure continuity of hospital operations.','stethoscope',0,2),
('د. سامية بالقاسم','Dr Samia Belkacem','Dr. Samia Belkacem','','','','النائب المكلف بالمصالح الإدارية والمالية','Sous-directrice des services administratifs et financiers','Deputy for Administrative & Financial Services','تتابع تسيير المصالح الإدارية وتنسيق الفرقة الصحية لضمان جودة الرعاية وتحسين الخدمات الإدارية.','Suit la gestion administrative et coordonne l''équipe de santé pour garantir la qualité des soins.','Follows administrative management and coordinates the care team to ensure quality of care.','users',0,3),
('د. يوسف بن شريف','Dr Youcef Ben Cherif','Dr. Youssef Ben Cherif','','','','النائب المكلف بالمصالح التقنية والصيانة','Sous-directeur des services techniques et maintenance','Deputy for Technical & Maintenance Services','يشرف على تسيير الموارد البشرية والصيانة والإدارة لضمان حسن التدبير والتنظيم داخل المستشفى.','Supervise les ressources humaines, la maintenance et l''administration pour une bonne organisation interne.','Oversees human resources, maintenance and administration to ensure good internal organisation.','settings',0,4);

INSERT INTO `administration_offices` (`title_ar`,`title_fr`,`title_en`,`description_ar`,`description_fr`,`description_en`,`display_order`) VALUES
('مكتب المدير العام','Bureau du directeur général','Director General''s Office','يتم من هذا المكتب اتخاذ القرارات الإستراتيجية ومتابعة سير عمل مختلف مصالح المستشفى.','Ce bureau prend les décisions stratégiques et suit le fonctionnement des services de l''hôpital.','Strategic decisions are made here and the work of all hospital services is monitored.',1),
('مكتب الموارد البشرية','Bureau des ressources humaines','Human Resources Office','يتكفل بتسيير مسار الموظفين وتوظيفهم وتكوينهم وضمان حقوقهم.','Gère le parcours, le recrutement et la formation du personnel.','Manages staff careers, recruitment and training.',2),
('مكتب المالية والمحاسبة','Bureau des finances et de la comptabilité','Finance & Accounting Office','يسهر على إعداد الميزانية ومتابعة النفقات والصفقات العمومية.','Prépare le budget et suit les dépenses et les marchés publics.','Prepares the budget and follows expenses and public procurement.',3);
