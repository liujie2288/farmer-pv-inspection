package com.yldlxj.pv.inspect.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.yldlxj.pv.inspect.common.ApiResponse;
import com.yldlxj.pv.inspect.common.annotation.RateLimit;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, Cache<String, Integer>> cacheMap = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        RateLimit rateLimit = ((HandlerMethod) handler).getMethodAnnotation(RateLimit.class);
        if (rateLimit == null) {
            return true;
        }

        String key = "rateLimit:" + rateLimit.limit() + ":" + rateLimit.duration();
        Cache<String, Integer> cache = cacheMap.computeIfAbsent(key, k ->
                Caffeine.newBuilder()
                        .expireAfterWrite(rateLimit.duration(), TimeUnit.SECONDS)
                        .build()
        );

        String clientIp = request.getRemoteAddr();
        int count = cache.asMap().getOrDefault(clientIp, 0) + 1;
        cache.put(clientIp, count);

        if (count > rateLimit.limit()) {
            try {
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(rateLimit.duration()));
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.error(429, "请求过于频繁，请稍后再试")));
            } catch (Exception e) {
                log.error("限流响应写入失败", e);
            }
            return false;
        }

        return true;
    }
}
