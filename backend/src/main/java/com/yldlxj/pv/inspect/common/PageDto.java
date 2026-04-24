package com.yldlxj.pv.inspect.common;

import lombok.Data;

import java.util.List;

@Data
public class PageDto<T> {

    private List<T> records;
    private long total;
    private long current;
    private long size;

    public static <T> PageDto<T> of(List<T> records, long total, long current, long size) {
        PageDto<T> page = new PageDto<>();
        page.setRecords(records);
        page.setTotal(total);
        page.setCurrent(current);
        page.setSize(size);
        return page;
    }
}
