CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`summaryFileName` varchar(255) NOT NULL,
	`dailyFileName` varchar(255) NOT NULL,
	`summaryData` text NOT NULL,
	`dailyData` text NOT NULL,
	`dateRange` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
