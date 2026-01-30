ALTER TABLE `reports` ADD `dataFilePath` varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` DROP COLUMN `summaryData`;--> statement-breakpoint
ALTER TABLE `reports` DROP COLUMN `dailyData`;