package com.yldlxj.pv.inspect.config;

import com.yldlxj.pv.inspect.auth.RefreshTokenService;
import com.yldlxj.pv.inspect.plan.InspectPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final InspectPlanService inspectPlanService;
    private final RefreshTokenService refreshTokenService;

    @Scheduled(cron = "5 0,10 * * * *")
    public void autoTransitionPlanStatus() {
        inspectPlanService.autoTransitionStatus();
    }

    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupExpiredTokens() {
        refreshTokenService.cleanupExpiredTokens();
    }

}
