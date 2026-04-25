package com.yldlxj.pv.inspect.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum InspectStatus {

    UNINSPECTED(0, "未巡检"),
    INSPECTED(1, "已巡检");

    @EnumValue
    @JsonValue
    private final int code;
    private final String label;

    public static InspectStatus of(int code) {
        for (InspectStatus s : values()) {
            if (s.code == code) return s;
        }
        throw new IllegalArgumentException("未知的InspectStatus: " + code);
    }
}
