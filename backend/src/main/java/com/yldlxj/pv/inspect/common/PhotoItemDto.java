package com.yldlxj.pv.inspect.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhotoItemDto {
    private Long itemId;
    private String itemName;
    private List<String> urls;
}
