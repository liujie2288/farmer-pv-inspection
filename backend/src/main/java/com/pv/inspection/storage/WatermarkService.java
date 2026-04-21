package com.pv.inspection.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
public class WatermarkService {

    public InputStream addWatermark(InputStream imageStream, String inspectorName,
                                     String time, String coordinates) {
        try {
            BufferedImage image = ImageIO.read(imageStream);
            if (image == null) {
                return imageStream;
            }

            Graphics2D g2d = image.createGraphics();
            int fontSize = Math.max(16, image.getWidth() / 30);
            g2d.setFont(new Font("SansSerif", Font.PLAIN, fontSize));

            String line1 = "巡检人: " + inspectorName;
            String line2 = "时间: " + time;
            String line3 = (coordinates != null && !coordinates.isEmpty())
                    ? "位置: " + coordinates
                    : "位置: 未记录";

            FontMetrics fm = g2d.getFontMetrics();
            int textWidth = Math.max(
                    fm.stringWidth(line1),
                    Math.max(fm.stringWidth(line2), fm.stringWidth(line3))
            );
            int lineHeight = fm.getHeight();
            int padding = 10;
            int barWidth = textWidth + padding * 2;
            int barHeight = lineHeight * 3 + padding * 2;
            int barX = image.getWidth() - barWidth - 10;
            int barY = image.getHeight() - barHeight - 10;

            // Semi-transparent black background bar
            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.55f));
            g2d.setColor(Color.BLACK);
            g2d.fillRoundRect(barX, barY, barWidth, barHeight, 8, 8);

            // White text
            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.9f));
            g2d.setColor(Color.WHITE);
            int textX = barX + padding;
            int textY = barY + padding + fm.getAscent();
            g2d.drawString(line1, textX, textY);
            g2d.drawString(line2, textX, textY + lineHeight);
            g2d.drawString(line3, textX, textY + lineHeight * 2);

            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "jpg", baos);
            return new ByteArrayInputStream(baos.toByteArray());
        } catch (IOException e) {
            log.error("水印添加失败: {}", e.getMessage());
            return imageStream;
        }
    }
}
