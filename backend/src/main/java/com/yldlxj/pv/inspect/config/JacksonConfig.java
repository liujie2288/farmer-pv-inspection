package com.yldlxj.pv.inspect.config;

import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

@Configuration
public class JacksonConfig {

    private static final String DATE_PATTERN = "yyyy-MM-dd";
    private static final String DATETIME_PATTERN = "yyyy-MM-dd HH:mm:ss";

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jsonCustomizer() {
        return builder -> builder
                .timeZone(TimeZone.getTimeZone("Asia/Shanghai"))
                .serializationInclusion(JsonInclude.Include.NON_NULL)
                .serializers(
                        new LocalDateSerializer(DateTimeFormatter.ofPattern(DATE_PATTERN)),
                        new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(DATETIME_PATTERN))
                )
                .deserializers(
                        new LocalDateDeserializer(DateTimeFormatter.ofPattern(DATE_PATTERN)),
                        new LocalDateTimeDeserializer(DateTimeFormatter.ofPattern(DATETIME_PATTERN))
                );
    }
}
