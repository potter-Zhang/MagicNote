package edu.whu.MagicNote.service.impl;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
@Service
public class TranscriptionService {
    public String transcribe(String filePath) {
        try {

            // 远程服务器的连接信息
            String hostname = "118.178.241.148";
            int port = 22;
            String username = "root";
            String password = "Cien2003119.";

            // 创建SSH会话
            JSch jsch = new JSch();
            Session session = jsch.getSession(username, hostname, port);
            session.setPassword(password);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();

            if (session.isConnected()) {
                System.out.println("SSH连接成功！");
            } else {
                System.out.println("SSH连接失败！");
            }
            // 创建SSH通道
            ChannelExec channel = (ChannelExec) session.openChannel("exec");

            // 创建ProcessBuilder对象，并指定Python解释器和脚本文件以及文件路径参数
            String pythonInterpreter = "/root/anaconda3/envs/javaee/bin/python3.9";
            String pythonScript = "/root/transcript.py";
            String command = pythonInterpreter + " " + pythonScript + " " + filePath;

            //ProcessBuilder processBuilder = new ProcessBuilder(pythonInterpreter, pythonScript, filePath);

            // 在远程服务器上执行命令
            channel.setCommand(command);
            channel.connect();

            // 读取命令执行结果
            InputStream inputStream = channel.getInputStream();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
            String line;
            StringBuilder output = new StringBuilder();
            while ((line = bufferedReader.readLine()) != null) {
                // 处理Python脚本的输出
                output.append(line).append("\n");
            }

            // 读取错误信息
            InputStream errorStream = channel.getErrStream();
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(errorStream));
            String errorLine;
            while ((errorLine = errorReader.readLine()) != null) {
                // 处理错误流的输出
                System.err.println(errorLine);
            }

            // 关闭SSH通道和会话
            channel.disconnect();
            session.disconnect();

            return output.toString();


           /* // 启动子进程并等待执行完成
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

            return output.toString();*/

        } catch (IOException | JSchException e) {
            // 处理异常
            e.printStackTrace();
            return "转录过程中发生错误。";
        }
    }
}
