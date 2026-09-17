package com.civicsync.CivicSync_Backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CivicSyncBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CivicSyncBackendApplication.class, args);
	}

}
