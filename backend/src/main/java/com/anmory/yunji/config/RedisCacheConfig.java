package com.anmory.yunji.config;

import com.anmory.yunji.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis 缓存配置：启用 @Cacheable，用户、家庭成员等热点数据 TTL 5–10 分钟。
 * user 缓存使用专用 User 序列化（不写 @class），兼容已有 Redis 中的旧数据。
 * 当 Redis 不可写（如 RDB 持久化失败、MISCONF）时，缓存读写错误仅打日志，不中断请求。
 */
@Slf4j
@Configuration
@EnableCaching
public class RedisCacheConfig implements CachingConfigurer {

    @Override
    @Nullable
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
                log.warn("[缓存] Redis 读失败，将直接查库 cache={} key={} msg={}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key, @Nullable Object value) {
                log.warn("[缓存] Redis 写失败，已忽略 cache={} key={} msg={}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(@NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
                log.warn("[缓存] Redis 驱逐失败 cache={} key={} msg={}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(@NonNull RuntimeException exception, @NonNull Cache cache) {
                log.warn("[缓存] Redis 清空失败 cache={} msg={}", cache.getName(), exception.getMessage());
            }
        };
    }

    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);

    private static final ObjectMapper CACHE_OBJECT_MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    /** 仅序列化/反序列化 User，不写入 @class，兼容旧缓存数据 */
    private static RedisSerializer<Object> userCacheSerializer() {
        return new RedisSerializer<Object>() {
            @Override
            public byte[] serialize(Object o) {
                if (o == null) return null;
                try {
                    return CACHE_OBJECT_MAPPER.writeValueAsBytes(o);
                } catch (Exception e) {
                    throw new org.springframework.data.redis.serializer.SerializationException("User serialize error", e);
                }
            }

            @Override
            public Object deserialize(byte[] bytes) {
                if (bytes == null || bytes.length == 0) return null;
                try {
                    return CACHE_OBJECT_MAPPER.readValue(bytes, User.class);
                } catch (Exception e) {
                    throw new org.springframework.data.redis.serializer.SerializationException("User deserialize error", e);
                }
            }
        };
    }

    /** 其他缓存用通用 JSON 序列化（不写 @class，避免读旧数据报错） */
    private static GenericJackson2JsonRedisSerializer defaultRedisJsonSerializer() {
        return new GenericJackson2JsonRedisSerializer(CACHE_OBJECT_MAPPER);
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(defaultRedisJsonSerializer()))
                .entryTtl(DEFAULT_TTL)
                .disableCachingNullValues();

        RedisCacheConfiguration userCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(userCacheSerializer()))
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        cacheConfigurations.put("user", userCacheConfig);
        cacheConfigurations.put("familyMembers", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
