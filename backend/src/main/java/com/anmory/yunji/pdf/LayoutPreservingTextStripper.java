package com.anmory.yunji.pdf;

import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * PDF 文本抽取器，保留表格布局结构。
 * 按字符坐标 (x,y) 分组，同一行内按 x 排序，列间用制表符分隔，空单元格保留占位。
 * 便于 AI 正确解析 B超、产检等表格型 PDF。
 */
public class LayoutPreservingTextStripper extends PDFTextStripper {

    private static final float ROW_TOLERANCE = 3f;
    private static final float COLUMN_GAP_THRESHOLD = 15f;

    private final List<TextPosition> positions = new ArrayList<>();

    public LayoutPreservingTextStripper() throws IOException {
        super();
        setSortByPosition(true);
    }

    @Override
    protected void processTextPosition(TextPosition text) {
        positions.add(text);
    }

    @Override
    protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
        // 不调用 super，由 endPage 统一输出
    }

    @Override
    protected void startPage(org.apache.pdfbox.pdmodel.PDPage page) throws IOException {
        super.startPage(page);
        positions.clear();
    }

    @Override
    protected void endPage(org.apache.pdfbox.pdmodel.PDPage page) throws IOException {
        if (!positions.isEmpty()) {
            String pageText = formatPositionsToTable(positions);
            if (pageText != null && !pageText.isBlank()) {
                try {
                    java.io.Writer out = output;
                    if (out != null) {
                        out.write(pageText);
                        if (!pageText.endsWith("\n")) out.write("\n");
                    }
                } catch (Exception ignored) {
                }
            }
            positions.clear();
        }
        super.endPage(page);
    }

    /**
     * 将 TextPosition 列表按行列组织，输出为制表符分隔的表格文本
     */
    private String formatPositionsToTable(List<TextPosition> positions) {
        if (positions.isEmpty()) return "";

        // 按 Y 分组（行），Y 相近的视为同一行
        Map<Float, List<TextPosition>> rows = new TreeMap<>(Comparator.reverseOrder());
        for (TextPosition tp : positions) {
            float y = tp.getY();
            Float rowKey = findRowKey(rows, y);
            if (rowKey == null) {
                rowKey = y;
            }
            rows.computeIfAbsent(rowKey, k -> new ArrayList<>()).add(tp);
        }

        // 每行内按 X 排序
        StringBuilder sb = new StringBuilder();
        for (List<TextPosition> row : rows.values()) {
            row.sort(Comparator.comparingDouble(TextPosition::getX));
            float lastEndX = -1;
            for (TextPosition tp : row) {
                float x = tp.getX();
                if (lastEndX >= 0 && (x - lastEndX) > COLUMN_GAP_THRESHOLD) {
                    sb.append("\t");
                }
                sb.append(tp.getUnicode());
                lastEndX = x + tp.getWidth();
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    private Float findRowKey(Map<Float, List<TextPosition>> rows, float y) {
        for (Float key : rows.keySet()) {
            if (Math.abs(key - y) <= ROW_TOLERANCE) {
                return key;
            }
        }
        return null;
    }
}
