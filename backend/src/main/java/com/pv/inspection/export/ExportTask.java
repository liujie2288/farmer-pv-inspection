package com.pv.inspection.export;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("export_task")
public class ExportTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long planId;

    private Long operatorId;

    private Integer status;

    private String fileUrl;

    private Long fileSize;

    private Integer totalCount;

    private String errorMessage;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    private LocalDateTime completeTime;
}
