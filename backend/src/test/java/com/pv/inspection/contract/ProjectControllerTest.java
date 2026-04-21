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
class ProjectControllerTest {

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
    void listProjects_returnsOk() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(get("/api/projects?page=1&size=10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    void createProject_returns201() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"projectName\":\"测试项目\",\"propertyCompany\":\"测试公司\",\"stationType\":\"户用\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.data.id").exists());
    }

    @Test
    void updateProject_returns200() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(put("/api/projects/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"projectName\":\"更新项目\",\"propertyCompany\":\"更新公司\",\"stationType\":\"分布式\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void getProjectStats_returnsOk() throws Exception {
        String token = getAdminToken();
        mockMvc.perform(get("/api/projects/1/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.farmerCount").exists());
    }
}
