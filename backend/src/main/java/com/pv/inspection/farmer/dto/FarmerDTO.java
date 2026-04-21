package com.pv.inspection.farmer.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.math.BigDecimal;

@Data
public class FarmerDTO {

    @NotBlank(message = "农户编号不能为空")
    private String farmerCode;

    @NotBlank(message = "农户姓名不能为空")
    private String farmerName;

    private String powerAccount;

    private String inverterSn;

    private String inverterBrand;

    private String moduleSpec;

    private Integer moduleCount;

    private BigDecimal capacityKw;
}
