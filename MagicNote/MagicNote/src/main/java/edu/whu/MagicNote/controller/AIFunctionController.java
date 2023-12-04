package edu.whu.MagicNote.controller;

import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import edu.whu.MagicNote.domain.AIObject;
import edu.whu.MagicNote.service.impl.AIFunctionService;
import edu.whu.MagicNote.service.impl.QAndAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/ai")
public class AIFunctionController {

    @Autowired
    private AIFunctionService aiFunctionService;

    @Autowired
    private QAndAService qAndAService;


    // 获取输入文字的摘要，或者说将输入文字精简、提取关键信息（通义千问版）
    @PostMapping("/abstract")
    public ResponseEntity<Void> abstractNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.abstractNote(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 获取笔记摘要（GPT版）
    @PostMapping("/abstractGPT")
    public ResponseEntity<Void> abstractNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.abstractNoteGPT(aiObject.getStr(), response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 扩写输入文字（通义千问版）
    @PostMapping("/expand")
    public ResponseEntity<Void> expandNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.expandNote(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 扩写输入文字（GPT版）
    @PostMapping("/expandGPT")
    public ResponseEntity<Void> expandNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.expandNoteGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 将输入文字分段
    @PostMapping("/segment")
    public ResponseEntity<Void> segmentNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.segmentNote(aiObject.getStr(), response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/segmentGPT")
    public ResponseEntity<Void> segmentNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.segmentNoteGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }


    // 根据关键词，自动生成笔记
    @PostMapping("/generate")
    public ResponseEntity<Void> generateNote(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateNote(aiObject.getStr(),aiObject.getNum(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generateGPT")
    public ResponseEntity<Void> generateNoteGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateNoteGPT(aiObject.getStr(),aiObject.getNum(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 根据笔记的合适内容生成表格
    @PostMapping("/generateTable")
    public ResponseEntity<Void> generateTable(@RequestBody AIObject aiObject, HttpServletResponse response) throws NoApiKeyException, InputRequiredException {
        try {
            aiFunctionService.generateTable(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generateTableGPT")
    public ResponseEntity<Void> generateTableGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateTableGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 根据笔记的合适内容生成流程图
    @PostMapping("/generateFlowChart")
    public ResponseEntity<Void> generateFlowChart(@RequestBody AIObject aiObject, HttpServletResponse response) throws NoApiKeyException, InputRequiredException {
        try {
            aiFunctionService.generateFlowChart(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generateFlowGPT")
    public ResponseEntity<Void> generateFlowGPT(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            aiFunctionService.generateFlowChartGPT(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 初始化问答模型的接口，在进入某个笔记的编辑界面时调用，以初始化，以便之后进行多轮问答
    @PostMapping("/init")
    public ResponseEntity<Void> initQAndA(@RequestBody AIObject aiObject) throws NoApiKeyException, InputRequiredException {
        qAndAService.init(aiObject.getStr());
        return ResponseEntity.ok().build();
    }

    // 回答问题时调用的接口
    @PostMapping("/answer")
    public ResponseEntity<String> getAnswer(@RequestBody AIObject aiObject, HttpServletResponse response) {
        try {
            qAndAService.answer(aiObject.getStr(),response);
            return ResponseEntity.ok().build();
        } catch (NoApiKeyException | InputRequiredException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping(value = "/streamAsk", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamCallWithMessage(String q, HttpServletResponse response)
            throws NoApiKeyException, ApiException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";

        String command = "接下来我会给出我的笔记，你需要提炼、 缩写我的笔记，尽量精简。\n" +
                "最终输出为markdown格式，同时你需要将最重要的那些信息在markdown中进行加粗。最后只需要输出最终结果的markdown，无需其他提示信息。\n" +
                "给出的笔记是：\n";

        String prompt = command + q;

        Generation gen = new Generation();

        Message userMsg = Message
                .builder()
                .role(Role.USER.getValue())
                .content(prompt)
                .build();
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(Arrays.asList(userMsg))
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .incrementalOutput(true) // get streaming output incrementally
                        .build();
        Flowable<GenerationResult> result = gen.streamCall(param);

        StringBuilder fullContent = new StringBuilder();
        System.out.println(fullContent.toString());
        return Flux.from(result)
                // add delay between each event
                .delayElements(Duration.ofMillis(1000))
                .map(message -> {
                    String output = message.getOutput().getChoices().get(0).getMessage().getContent();
                    System.out.println(output); // print the output
                    return ServerSentEvent.<String>builder()
                            .data(output)
                            .build();
                })
                .concatWith(Flux.just(ServerSentEvent.<String>builder().comment("").build()))
                .doOnError(e -> {
                    if (e instanceof NoApiKeyException) {
                        // 处理 NoApiKeyException
                    } else if (e instanceof InputRequiredException) {
                        // 处理 InputRequiredException
                    } else if (e instanceof ApiException) {
                        // 处理其他 ApiException
                    } else {
                        // 处理其他异常
                    }
                });
    }

    @GetMapping(value = "/streamQwen", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public void streamQwen(String q, HttpServletResponse response)
            throws NoApiKeyException, ApiException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";

        String command = "接下来我会给出我的笔记，你需要提炼、 缩写我的笔记，尽量精简。\n" +
                "要求：1、最终输出为markdown格式；" +
                "2、你需要将最重要的那些信息在markdown中进行加粗、加红色等；" +
                "3、充分使用多级标题；" +
                "4、最终不需要回答其他信息，返回markdown结果即可。"+
                "给出的笔记是：\n";

        String prompt = command + q;

        Generation gen = new Generation();

        Message userMsg = Message
                .builder()
                .role(Role.USER.getValue())
                .content(prompt)
                .build();
        QwenParam param =
                QwenParam.builder().model("qwen-max").messages(Arrays.asList(userMsg))
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .incrementalOutput(true) // get streaming output incrementally
                        .build();
        Flowable<GenerationResult> result = gen.streamCall(param);
        StringBuilder fullContent = new StringBuilder();

        // 需要指定response的ContentType为流式输出，且字符编码为UTF-8
        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");

        // 禁用缓存
        response.setHeader("Cache-Control", "no-cache");

        result.blockingForEach(message -> {
            fullContent.append(message.getOutput().getChoices().get(0).getMessage().getContent());
            response.getOutputStream().write(message.getOutput().getChoices().get(0).getMessage().getContent().getBytes());
            response.getOutputStream().flush();
        });
        System.out.println("Full content: \n" + fullContent.toString());
        System.out.println(fullContent.toString());
    }

    @GetMapping("/streamChatWithWeb")
    public void streamChatWithWeb(String content, HttpServletResponse response) throws IOException {

        aiFunctionService.abstractNoteGPT(content, response);
    }
}
