package com.anmory.yunji.health;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.TreeMap;

/**
 * 孕期体重参考标准（累计增重 kg）
 */
public final class WeightReference {

    private static final NavigableMap<Integer, BigDecimal> BASE_GAIN = new TreeMap<>();

    static {
        BASE_GAIN.put(8, new BigDecimal("0.5"));
        BASE_GAIN.put(9, new BigDecimal("0.7"));
        BASE_GAIN.put(10, new BigDecimal("0.9"));
        BASE_GAIN.put(11, new BigDecimal("1.1"));
        BASE_GAIN.put(12, new BigDecimal("1.4"));
        BASE_GAIN.put(13, new BigDecimal("1.7"));
        BASE_GAIN.put(14, new BigDecimal("2.0"));
        BASE_GAIN.put(15, new BigDecimal("2.3"));
        BASE_GAIN.put(16, new BigDecimal("2.7"));
        BASE_GAIN.put(17, new BigDecimal("3.0"));
        BASE_GAIN.put(18, new BigDecimal("3.4"));
        BASE_GAIN.put(19, new BigDecimal("3.8"));
        BASE_GAIN.put(20, new BigDecimal("4.3"));
        BASE_GAIN.put(21, new BigDecimal("4.7"));
        BASE_GAIN.put(22, new BigDecimal("5.1"));
        BASE_GAIN.put(23, new BigDecimal("5.5"));
        BASE_GAIN.put(24, new BigDecimal("5.9"));
        BASE_GAIN.put(25, new BigDecimal("6.4"));
        BASE_GAIN.put(26, new BigDecimal("6.8"));
        BASE_GAIN.put(27, new BigDecimal("7.2"));
        BASE_GAIN.put(28, new BigDecimal("7.4"));
        BASE_GAIN.put(29, new BigDecimal("7.7"));
        BASE_GAIN.put(30, new BigDecimal("8.2"));
        BASE_GAIN.put(31, new BigDecimal("8.4"));
        BASE_GAIN.put(32, new BigDecimal("8.8"));
        BASE_GAIN.put(33, new BigDecimal("9.2"));
        BASE_GAIN.put(34, new BigDecimal("9.6"));
        BASE_GAIN.put(35, new BigDecimal("10.0"));
        BASE_GAIN.put(36, new BigDecimal("10.4"));
        BASE_GAIN.put(37, new BigDecimal("10.6"));
        BASE_GAIN.put(38, new BigDecimal("11.0"));
        BASE_GAIN.put(39, new BigDecimal("11.3"));
        BASE_GAIN.put(40, new BigDecimal("11.3"));
    }

    private WeightReference() {
    }

    public static BigDecimal suggestedGainKg(int week) {
        if (week <= 0) return BigDecimal.ZERO;
        if (BASE_GAIN.containsKey(week)) return BASE_GAIN.get(week);
        Map.Entry<Integer, BigDecimal> low = BASE_GAIN.floorEntry(week);
        Map.Entry<Integer, BigDecimal> high = BASE_GAIN.ceilingEntry(week);
        if (low == null && high == null) return BigDecimal.ZERO;
        if (low == null) return high.getValue();
        if (high == null) return low.getValue();
        if (Objects.equals(low.getKey(), high.getKey())) return low.getValue();
        int w1 = low.getKey();
        int w2 = high.getKey();
        BigDecimal g1 = low.getValue();
        BigDecimal g2 = high.getValue();
        BigDecimal t = new BigDecimal(week - w1).divide(new BigDecimal(w2 - w1), 6, RoundingMode.HALF_UP);
        return g1.add(g2.subtract(g1).multiply(t)).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal[] rangeForSuggested(BigDecimal suggested) {
        if (suggested == null) return new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO};
        BigDecimal min = suggested.subtract(new BigDecimal("0.8"));
        BigDecimal max = suggested.add(new BigDecimal("0.8"));
        if (min.compareTo(BigDecimal.ZERO) < 0) min = BigDecimal.ZERO;
        return new BigDecimal[]{min.setScale(2, RoundingMode.HALF_UP), max.setScale(2, RoundingMode.HALF_UP)};
    }

    public static String statusOf(BigDecimal actual, BigDecimal min, BigDecimal max) {
        if (actual == null || min == null || max == null) return "unknown";
        if (actual.compareTo(min) < 0) return "below";
        if (actual.compareTo(max) > 0) return "above";
        return "within";
    }

    public static String advice(String status, Integer week) {
        String w = week != null ? ("（孕" + week + "周）") : "";
        return switch (status != null ? status : "unknown") {
            case "below" -> "体重增长偏低" + w + "：可适度增加优质蛋白与主食摄入，保证睡眠；若连续偏低或伴随不适，请咨询产科医生。";
            case "above" -> "体重增长偏快" + w + "：建议减少含糖饮料与高油零食，增加散步等低强度运动；若近期增长明显或有水肿/血压异常，请及时就医。";
            case "within" -> "体重增长在参考范围内" + w + "：保持当前饮食结构与规律活动即可。";
            default -> "暂无建议。";
        };
    }
}
