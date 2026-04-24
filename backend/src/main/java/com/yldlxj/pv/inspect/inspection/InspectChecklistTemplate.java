package com.yldlxj.pv.inspect.inspection;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("inspect_checklist_template")
public class InspectChecklistTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Integer sectionId;

    private String sectionName;

    private Integer itemOrder;

    private String content;

    private String category;

    private Integer hasNumeric;

    private String numericLabels;

    private Integer hasPhoto;
}
