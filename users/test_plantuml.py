#!/usr/bin/env python3
import subprocess
import tempfile
import os

# 测试PlantUML生成
jar_path = "/tmp/plantuml.jar"
test_code = "@startuml\nAlice -> Bob: Hello World\n@enduml"

# 创建临时目录
temp_dir = tempfile.mkdtemp()
print(f"临时目录: {temp_dir}")

# 创建.puml文件
puml_file = os.path.join(temp_dir, "test.puml")
with open(puml_file, 'w') as f:
    f.write(test_code)

# 运行PlantUML
cmd = ['java', '-jar', jar_path, '-tpng', puml_file, '-o', temp_dir]
print(f"运行命令: {' '.join(cmd)}")

result = subprocess.run(cmd, capture_output=True, text=True)
print(f"返回码: {result.returncode}")
print(f"标准输出: {result.stdout[:100]}")
print(f"标准错误: {result.stderr[:100]}")

# 检查生成的文件
for f in os.listdir(temp_dir):
    print(f"文件: {f}")
    if f.endswith('.png'):
        png_file = os.path.join(temp_dir, f)
        print(f"✅ 找到PNG文件: {png_file}")
        print(f"   大小: {os.path.getsize(png_file)} 字节")

# 清理
import shutil
shutil.rmtree(temp_dir)