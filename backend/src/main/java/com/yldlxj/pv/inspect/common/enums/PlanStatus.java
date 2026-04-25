package com.yldlxj.pv.inspect.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PlanStatus {

    PENDING(0, "待开始"),
    IN_PROGRESS(1, "进行中"),
    FINISHED(2, "已结束");

    @EnumValue
    @JsonValue
    private final int code;
    private final String label;

    public static PlanStatus of(int code) {
        for (PlanStatus s : values()) {
            if (s.code == code) return s;
        }
        throw new IllegalArgumentException("未知的PlanStatus: " + code);
    }
}
