package com.example.ecomerce_backend.config;

import com.example.ecomerce_backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
    private final FileStorageService fileStorageService;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Thư mục đã được tạo trong FileStorageService nên toUri() luôn có dấu "/" ở cuối
        registry.addResourceHandler(FileStorageService.PUBLIC_PREFIX + "**")
                .addResourceLocations(fileStorageService.getRoot().toUri().toString());
    }
}
