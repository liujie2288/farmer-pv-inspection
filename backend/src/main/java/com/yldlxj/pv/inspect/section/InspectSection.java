package com.yldlxj.pv.inspect.section;

import com.baomidou.mybatisplus.annotation.TableName;
import com.yldlxj.pv.inspect.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspect_section")
public class InspectSection extends BaseEntity {

    private Integer sectionNo;

    private String sectionName;
}
