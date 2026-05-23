CREATE DATABASE IF NOT EXISTS `gpi_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gpi_db`;

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_resets` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  KEY `password_resets_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tokenable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `abilities` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  KEY `pat_type_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `matricule` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL UNIQUE,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('etudiant','enseignant','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'etudiant',
  `bulletin_publie` tinyint(1) NOT NULL DEFAULT 0,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Identifiants de connexion par défaut
-- Admin      : admin@iscae.mr / adminiscae
-- Enseignant : med@prof.iscae.mr / mediscae
-- Étudiant   : I12345@etu.iscae.mr / I12345iscae

insert into users (name, email, matricule, password, role) values
('ADMIN', 'admin@iscae.mr', NULL, '$2y$10$kC6LzD7/z/w.4kanhbw6aOXVS/ntY0EtzK1RRysRR4Tr4CxR3K896', 'admin'),
('prof', 'med@prof.iscae.mr', NULL, '$2y$10$Tbbo05FYtl7zzYv9lESIJuo3A/CvxlEn0P376a6oeCYCJgAi8z4ZK', 'enseignant'),
('etudiant', 'I12345@etu.iscae.mr', 'I12345', '$2y$10$ThYgXRZpCJenPLaG9UfLY.roqJyGu2Eu6pZGsI2BuBK9oeqIqdbTK', 'etudiant');

CREATE TABLE `classes` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nom_classe` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, -- Ex: "Licence 1 Informatique"
  `niveau` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL, -- Ex: "L1", "M2"
  `annee_scolaire` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL, -- Ex: "2025-2026"
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `matieres` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nom_matiere` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL, -- Ex: "Algorithmique"
  `coefficient` int(11) NOT NULL DEFAULT 1,
  `filiere` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `affectations` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` bigint(20) UNSIGNED NOT NULL, -- L'ID du professeur (clé étrangère vers 'users')
  `matiere_id` bigint(20) UNSIGNED NOT NULL, -- L'ID de la matière (clé étrangère vers 'matieres')
  `classe_id` bigint(20) UNSIGNED NOT NULL, -- L'ID de la classe (clé étrangère vers 'classes')
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  
  CONSTRAINT `fk_affectation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_affectation_matiere` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_affectation_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  
  UNIQUE KEY `unique_affectation` (`user_id`, `matiere_id`, `classe_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `etudiant_classe` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint(20) UNSIGNED NOT NULL, -- L'ID de l'étudiant
    `classe_id` bigint(20) UNSIGNED NOT NULL, -- L'ID de la classe
    
    CONSTRAINT `fk_etu_classe_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_etu_classe_classe` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
    
    UNIQUE KEY `unique_etu_classe` (`user_id`, `classe_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notes` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `etudiant_id` bigint(20) UNSIGNED NOT NULL, -- Clé étrangère vers users (role etudiant)
  `matiere_id` bigint(20) UNSIGNED NOT NULL, -- Clé étrangère vers matieres
  `prof_id` bigint(20) UNSIGNED NOT NULL, -- Clé étrangère vers users (role enseignant) - pour garder une trace de qui a noté
  `valeur_note` decimal(4,2) NOT NULL, -- Permet des notes comme 15.50
  `statut_validation` boolean NOT NULL DEFAULT 0, -- 0 = saisie en cours (modifiable), 1 = validée (non modifiable)
  `type_evaluation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Examen', -- Ex: "Examen", "CC1", "TD"
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  
  CONSTRAINT `fk_note_etudiant` FOREIGN KEY (`etudiant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_note_matiere` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_note_prof` FOREIGN KEY (`prof_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  
  CHECK (`valeur_note` >= 0 AND `valeur_note` <= 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;