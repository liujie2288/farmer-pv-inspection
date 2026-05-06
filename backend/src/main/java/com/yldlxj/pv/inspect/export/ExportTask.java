package com.yldlxj.pv.inspect.export;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.yldlxj.pv.inspect.common.BaseEntity;
import com.yldlxj.pv.inspect.config.ExportTaskFileTypeHandler;
import com.yldlxj.pv.inspect.export.dto.ExportTaskFileDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "export_task", autoResultMap = true)
public class ExportTask extends BaseEntity {

    private String type;

    private Integer status;

    private Long planId;

    private Long projectId;

    @TableField(typeHandler = ExportTaskFileTypeHandler.class)
    private List<ExportTaskFileDto> files;

    private Integer totalCount;

    private String failReason;

    private Long operatorId;

    private LocalDateTime finishTime;
}
