package com.yldlxj.pv.inspect.record.dto.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChecklistItemVo {
    private Long itemId;
    private Integer itemNo;
    private String category;
    private String content;
    private Integer itemType;
    private Boolean result;
    private String remark;
    private String value;
}
