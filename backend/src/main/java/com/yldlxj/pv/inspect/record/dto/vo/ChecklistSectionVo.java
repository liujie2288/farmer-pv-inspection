package com.yldlxj.pv.inspect.record.dto.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChecklistSectionVo {
    private Long sectionId;
    private String sectionName;
    private Integer sectionNo;
    private List<ChecklistItemVo> items;
}
