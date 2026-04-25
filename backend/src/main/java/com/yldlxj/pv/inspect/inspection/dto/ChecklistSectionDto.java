package com.yldlxj.pv.inspect.inspection.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChecklistSectionDto {
    private Long sectionId;
    private List<ChecklistItemDto> items;
}
