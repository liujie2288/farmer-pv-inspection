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
    private List<PhotoItemVo> photos;

    public boolean hasCategory() {
        if (items != null) {
            for (ChecklistItemVo item : items) {
                if (item.getCategory() != null && item.getCategory().equals(sectionName)) {
                    return true;
                }
            }
        }
        return false;
    }
}
