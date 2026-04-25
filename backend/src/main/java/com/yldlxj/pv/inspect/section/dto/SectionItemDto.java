package com.yldlxj.pv.inspect.section.dto;

import com.yldlxj.pv.inspect.common.enums.ItemType;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class SectionItemDto {

    @NotNull(message = "所属大项ID不能为空")
    private Long sectionId;

    @Size(max = 20, message = "类别最长20字符")
    private String category;

    @NotNull(message = "小项序号不能为空")
    private Integer itemNo;

    @NotBlank(message = "巡检内容不能为空")
    @Size(max = 500, message = "巡检内容最长500字符")
    private String content;

    private ItemType itemType;
}
