package com.yldlxj.pv.inspect.inspection.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChecklistItemDto {
    private Long itemId;
    private Boolean result;
    private String remark;
    private String value;
}
