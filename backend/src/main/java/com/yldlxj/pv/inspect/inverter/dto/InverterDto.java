package com.yldlxj.pv.inspect.inverter.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.math.BigDecimal;

@Data
public class InverterDto {

    @NotBlank(message = "逆变器编号不能为空")
    private String inverterCode;

    @NotBlank(message = "户主姓名不能为空")
    private String ownerName;

    private String address;

    private String powerAccount;

    private String inverterSn;

    private String inverterBrand;

    private BigDecimal capacityKw;

    private Integer moduleCount;

    private String moduleSpec;

    private BigDecimal longitude;

    private BigDecimal latitude;
}
