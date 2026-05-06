package com.yldlxj.pv.inspect.export.dto;

import lombok.Data;

@Data
public class ExportTaskFileDto {
    private Integer batchNo;
    private String ossKey;
    private String fileName;
    private Long fileSize;
}
