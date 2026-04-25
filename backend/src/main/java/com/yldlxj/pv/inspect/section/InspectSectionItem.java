package com.yldlxj.pv.inspect.section;

import com.baomidou.mybatisplus.annotation.TableName;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspect_section_item")
public class InspectSectionItem extends BaseEntity {

    private Long sectionId;

    private String category;

    private Integer itemNo;

    private String content;

    private ItemType itemType;
}
