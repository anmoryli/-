package com.anmory.yunji.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 日期时间参数转换：支持前端传入的 ISO-8601 带 Z 格式（如 2026-03-11T14:45:35.086Z）。
 */
@Configuration
public class DateTimeConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToLocalDateTimeConverter());
    }

    static class StringToLocalDateTimeConverter implements Converter<String, LocalDateTime> {
        @Override
        public LocalDateTime convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return Instant.parse(source)
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime();
            } catch (Exception e) {
                return LocalDateTime.parse(source, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
        }
    }
}
