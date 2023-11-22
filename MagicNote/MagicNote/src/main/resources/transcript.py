import sys
import whisper
sys.stdout.reconfigure(encoding='utf-8')
# 获取命令行参数作为路径
file_path = sys.argv[1]

model = whisper.load_model("base")
result = model.transcribe(file_path)
text = result["text"]
print(text)