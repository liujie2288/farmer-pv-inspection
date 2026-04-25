package com.yldlxj.pv.inspect.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhotoSectionDto {
    private Long sectionId;
    private List<PhotoItemDto> items;
}
