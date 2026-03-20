# markdown_to_docx.py
import sys
from markdown2docx import convert

def main():
    # 检查命令行参数
    if len(sys.argv) != 3:
        print("使用方法: python markdown_to_docx.py <输入markdown文件路径> <输出docx文件路径>")
        print("示例: python markdown_to_docx.py 孕期宝用户特色文档_769f2702.plan.md output.docx")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        # 执行转换
        convert(input_file, output_file)
        print(f"✅ 转换成功！文件已保存至: {output_file}")
    except FileNotFoundError:
        print(f"❌ 错误：找不到文件 {input_file}，请检查文件路径是否正确")
    except Exception as e:
        print(f"❌ 转换失败：{str(e)}")

if __name__ == "__main__":
    main()