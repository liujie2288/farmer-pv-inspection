package com.yldlxj.pv.inspect.record.dto.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhotoSectionVo {
    private Long sectionId;
    private String sectionName;
    private List<PhotoItemVo> items;

    public PhotoSectionVo(Long sectionId) {
        this.sectionId = sectionId;
    }
}
