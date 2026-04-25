package com.yldlxj.pv.inspect.section.dto;

import lombok.Data;

import java.util.List;

@Data
public class SectionViewVo {

    private Long id;
    private Integer sectionNo;
    private String sectionName;
    private List<SectionItemViewVo> items;
}
