package edu.whu.MagicNote.service.impl;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
@Service
public class TranscriptionService {
    public String transcribe(String filePath) {
        try {
            // 创建ProcessBuilder对象，并指定Python解释器和脚本文件以及文件路径参数
            String pythonInterpreter = "D:/PSoftware/anaconda3/envs/javaee/python.exe";
            String pythonScript = "src/main/resources/transcript.py";
            ProcessBuilder processBuilder = new ProcessBuilder(pythonInterpreter, pythonScript, filePath);

            // 启动子进程并等待执行完成
            Process process = processBuilder.start();
            int exitCode = process.waitFor();

            // 读取子进程的输出结果
            InputStream inputStream = process.getInputStream();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
            String line;
            StringBuilder output = new StringBuilder();
            while ((line = bufferedReader.readLine()) != null) {
                // 处理Python脚本的输出
                output.append(line).append("\n");
            }
            //读取子进程的错误信息
            InputStream errorStream = process.getErrorStream();
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(errorStream));
            String errorLine;
            while ((errorLine = errorReader.readLine()) != null) {
                // 处理错误流的输出
                System.err.println(errorLine);
            }

            return output.toString();
        } catch (IOException | InterruptedException e) {
            // 处理异常
            e.printStackTrace();
            return "转录过程中发生错误。";
        }
    }
}
