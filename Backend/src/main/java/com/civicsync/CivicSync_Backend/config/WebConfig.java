package com.civicsync.CivicSync_Backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 🎯 Maps the public "/uploads/**" URL path to the actual "uploads" folder on
 * disk (where grievance photo/video evidence is saved), so the Grievances tab,
 * Map pin details, and Upvote cards can load citizen-submitted photo evidence
 * directly via an <Image> tag on the frontend.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadsPath = "file:" + System.getProperty("user.dir") + "/uploads/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsPath);
    }
}
