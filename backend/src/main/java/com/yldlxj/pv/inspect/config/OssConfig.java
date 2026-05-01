package com.yldlxj.pv.inspect.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class OssConfig {

    @Value("${aliyun.oss.endpoint}")
    private String endpoint;

    @Value("${aliyun.oss.access-key-id}")
    private String accessKeyId;

    @Value("${aliyun.oss.access-key-secret}")
    private String accessKeySecret;

    @Bean(destroyMethod = "shutdown")
    @ConditionalOnProperty(name = "aliyun.oss.enabled", havingValue = "true", matchIfMissing = false)
    public OSS ossClient() {
        log.info("OSS client enabled, endpoint: {}", endpoint);
        return new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
    }
}
