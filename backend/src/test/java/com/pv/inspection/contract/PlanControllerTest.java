package com.pv.inspection.contract;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String getAdminToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andReturn().getResponse().getContentAsString();
        return response.split("\"token\":\"")[1].split("\"")[0];
    }

    @Test
    void listPlans_returnsOk() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(get("/api/plans?page=1&size=10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void createPlan_returns201() throws Exception {
        String token = getAdminToken();
        // Create project first
        String projRes = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"projectName\":\"计划测试项目\",\"propertyCompany\":\"测试\",\"stationType\":\"户用\"}"))
                .andReturn().getResponse().getContentAsString();
        String projectId = projRes.split("\"id\":")[1].split("}")[0];

        mockMvc.perform(post("/api/plans")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"planName\":\"测试计划\",\"projectId\":" + projectId + ",\"startTime\":\"2026-05-01T00:00:00\",\"endTime\":\"2026-05-31T23:59:59\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201));
    }

    @Test
    void getActivePlan_returnsNull() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(get("/api/plans/active?projectId=999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
