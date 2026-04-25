package com.yldlxj.pv.inspect.section.dto;

import com.yldlxj.pv.inspect.common.enums.ItemType;
import lombok.Data;

@Data
public class SectionItemViewVo {

    private Long id;
    private Long sectionId;
    private String category;
    private Integer itemNo;
    private String content;
    private ItemType itemType;
}
