package com.yldlxj.pv.inspect.config;

import com.aliyun.oss.ClientBuilderConfiguration;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.common.comm.Protocol;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OssConfig {

    @Value("${aliyun.oss.endpoint}")
    private String endpoint;

    @Value("${aliyun.oss.access-key-id}")
    private String accessKeyId;

    @Value("${aliyun.oss.access-key-secret}")
    private String accessKeySecret;

    @Bean(destroyMethod = "shutdown")
    public OSS ossClient() {
        // 创建 ClientConfiguration 实例
        ClientBuilderConfiguration conf = new ClientBuilderConfiguration();
        // 【关键】显式设置协议为 HTTPS
        conf.setProtocol(Protocol.HTTPS);
        return new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret, conf);
    }

}
