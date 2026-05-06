package com.yldlxj.pv.inspect.record.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WatermarkConfigDto {
    private List<String> fields;
    private List<String> customTexts;

    public boolean hasField(String field) {
        return fields != null && fields.contains(field);
    }
}
