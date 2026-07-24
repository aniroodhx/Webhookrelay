package com.anirudh.webhookrelay.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${ALLOWED_ORIGIN:}")
    private String extraOrigin;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        var patterns = new java.util.ArrayList<>(java.util.List.of(
            "http://localhost:*",
            "https://*.vercel.app",
            "https://*.railway.app",
            "https://*.onrender.com"
        ));
        if (!extraOrigin.isBlank()) patterns.add(extraOrigin);

        registry.addMapping("/api/**")
                .allowedOriginPatterns(patterns.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
