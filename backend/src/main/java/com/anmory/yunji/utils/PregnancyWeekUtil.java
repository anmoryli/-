package com.anmory.yunji.utils;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.Period;

/**
 * 孕周计算工具类
 * 核心逻辑：孕周 = 末次月经到当前日期的天数 / 7（向下取整）
 */
@Slf4j
public class PregnancyWeekUtil {

    /**
     * 计算孕周
     * @param lastMenstrualDate 末次月经日期（yyyy-MM-dd）
     * @return 孕周（如：8周）
     */
    public static String calculatePregnancyWeek(String lastMenstrualDate) {
        if (lastMenstrualDate == null || lastMenstrualDate.trim().isEmpty()) {
            return "未知";
        }

        try {
            LocalDate lmd = LocalDate.parse(lastMenstrualDate);
            LocalDate now = LocalDate.now();
            Period period = Period.between(lmd, now);

            // 总天数 = 年差*365 + 月差*30 + 日差（简化计算，精准计算可使用ChronoUnit.DAYS）
            long totalDays = period.getYears() * 365L + period.getMonths() * 30L + period.getDays();
            int week = (int) (totalDays / 7);

            // 边界处理：小于1周显示0周，大于40周显示40+周
            if (week < 1) {
                return "0周";
            } else if (week > 40) {
                return "40+周";
            } else {
                return week + "周";
            }
        } catch (Exception e) {
            log.error("孕周计算失败，末次月经日期格式错误：{}", lastMenstrualDate, e);
            return "未知";
        }
    }

    // 重载方法：接收LocalDate类型参数
    public static String calculatePregnancyWeek(LocalDate lastMenstrualDate) {
        if (lastMenstrualDate == null) {
            return "未知";
        }
        LocalDate now = LocalDate.now();
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(lastMenstrualDate, now);
        int week = (int) (totalDays / 7);

        if (week < 1) {
            return "0周";
        } else if (week > 40) {
            return "40+周";
        } else {
            return week + "周";
        }
    }

    /** 宝宝大小类比描述（用于 PDF 封面等），仅使用安全、健康的比喻 */
    public static String getBabySizeDescription(int week) {
        if (week < 4 || week > 40) return "";
        String[] names = {
            "芝麻粒", "芝麻", "小扁豆", "蓝莓", "覆盆子", "葡萄", "金桔", "无花果", "青柠", "柠檬",
            "桃子", "苹果", "牛油果", "梨", "红薯", "芒果", "香蕉", "胡萝卜", "木瓜", "葡萄柚",
            "玉米", "花菜", "大白菜", "生菜", "茄子", "南瓜", "大白菜", "椰子", "哈密瓜", "菠萝",
            "甜瓜", "蜜瓜", "长生菜", "冬瓜", "西瓜", "小南瓜", "大西瓜"
        };
        String[] sizes = {
            "0.1cm", "0.2cm", "0.6cm", "1.3cm", "1.6cm", "2.3cm", "3.1cm", "4.1cm", "5.4cm", "7.4cm",
            "8.7cm", "10.1cm", "11.6cm", "13cm", "14.2cm", "15.3cm", "25.6cm", "26.7cm", "27.8cm", "28.9cm",
            "30cm", "34.6cm", "35.6cm", "36.6cm", "37.6cm", "38.6cm", "39.9cm", "41.1cm", "42.4cm", "43.7cm",
            "45cm", "46.2cm", "47.4cm", "48.6cm", "49.8cm", "50.7cm", "51.2cm"
        };
        int idx = Math.min(week - 4, names.length - 1);
        return "约" + names[idx] + "大小 " + sizes[idx];
    }
}