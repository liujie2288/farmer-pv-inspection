package com.yldlxj.pv.inspect.export.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExportTaskVo {
    private Long id;
    private String type;
    private Integer status;
    private Long planId;
    private Long projectId;
    private String projectName;
    private Integer totalCount;
    private String failReason;
    private String operatorName;
    private LocalDateTime finishTime;
    private LocalDateTime createTime;
    private List<ExportTaskFileDto> files;
}
