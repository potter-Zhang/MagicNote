package edu.whu.MagicNote;

import com.alibaba.dashscope.aigc.conversation.Conversation;
import com.alibaba.dashscope.aigc.conversation.ConversationParam;
import com.alibaba.dashscope.aigc.conversation.ConversationResult;
import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.aigc.generation.models.QwenParam;
import com.alibaba.dashscope.common.Message;
import com.alibaba.dashscope.common.MessageManager;
import com.alibaba.dashscope.common.ResultCallback;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.utils.Constants;
import com.alibaba.dashscope.utils.JsonUtils;

import java.util.concurrent.Semaphore;

public class apiTest {

    static String s1 = "接下来我会给出我的笔记，你需要帮助我整理我的笔记，\n" +
            "你需要提炼笔记的主要内容，并且输出为markdown格式，并将其中的重要信息加粗，标题居中显示.\n" +
            //"你需要扩写笔记内容，输出为markdown格式，markdown笔记格式丰富一些，多进行字体加粗、字体色彩、分段等。\n" +
            //"然后你需要根据续写的笔记内容生成思维导图，也输出为markdown格式，\n" +
            //"你需要根据笔记内容生成markdown形式思维导图，加粗‘阿根廷’字样，数字用红色字体。\n" +
            "给出的笔记是:\n";

    static String s2 = "现年52岁的米莱，经济学家出身，是阿根廷“自由前进党”的创建者和主要领导人。\n" +
            "此次阿根廷总统选举得到外界普遍关注，其中一个重要原因是极端右翼政客米莱的参选。由于阿根廷通货膨胀率已经达到142.7%，且该国多年来经济增长严重放缓，米莱主张全面美元化。据参考消息8月15日报道，米莱的竞选承诺是要“炸掉”阿根廷央行，还提议大幅削减税收和公共开支。\n" +
            "此外，米莱所引发的争议还在于他支持器官买卖合法化，实行宽松的枪支管制政策，禁止堕胎合法化。因为与美国前总统特朗普有一些共同点，比如酷爱社交媒体，经常语出惊人等，米莱被一些媒体称为“阿根廷特朗普”。\n" +
            "据央视财经报道，目前，阿根廷货币贬值，通胀高企，极大地推高了当地的物价水平。为缓解生活成本压力，阿根廷民众也开始寻找一些节省开支的办法，以物换物市场再度受到青睐。据了解，阿根廷正面临严重的通胀压力。当地时间13日，阿根廷政府公布的10月通胀率达到8.3%，过去12个月累计通胀率达142.7%，创32年来新高。阿根廷央行今年内6次加息，将基准利率上调至133%，以应对当前复杂的通胀形势。\n" ;

    static String s3 = "小木偶拥有了人类所有的表情后,很兴奋,整天对着镜子做表情";

    static String s4 = "# <center>Chapter3  Spring Core</center>\n" +
            "## 1. Introduction to Spring\n" +
            "+ Spring Ecosphere\n" +
            "1. Spring Framework(the core framework,the basis)\n" +
            "2. SpringBoot(重点，简化开发)\n" +
            "3. SpringCloud\n" +
            "+ **Architecture of Spring**\n" +
            "\n" +
            "\n" +
            "## 2. Spring IOC（控制反转）\n" +
            "+ Tight-couple programming（紧耦合式的编程）\n" +
            "面向对象原则之————开闭原则（对于功能扩展开放，对于代码修改封闭）\n" +
            "+ Loose-coupled programming（松耦合）<br>\n" +
            "在类之外，使用其他方式为对象赋值（例如上图中的setBookDao()方法）\n" +
            "\n" +
            "+ IOC（控制反转）\n" +
            "\n" +
            "## 3. Spring\n" +
            "+ create a Spring project with Maven\n" +
            "\n" +
            "\n" +
            "## 4. Lifecycle of Beans\n" +
            "1. Scope of Beans\n" +
            "  + scope=\"singleton\"(default)（一般用这种）\n" +
            "  + scope=\"prototype\"\n" +
            "2. Instantiation with Factory（使用工厂进行实例化）\n" +
            "3. init-method and destroy-method\n" +
            "init-method：初始化bean时的操作\n" +
            "destroy-method：bean被销毁前的操作\n" +
            "4. Initializing and DisposableBean\n" +
            "\n" +
            "\n" +
            "## 5. Dependency Injection\n" +
            "1. Dependency Injection with Setter\n" +
            "常用的方式，设置set方法，使用setter注入\n" +
            "2. Dependency Injection with Constructor\n" +
            "3. Injection for Collections\n" +
            "4. Autowired Injection By Type\n" +
            "5. Autowired Injection By Name\n" +
            "\n" +
            "## 6. IOC Containers\n" +
            "\n" +
            "\n" +
            "## 7. Spring Annotations\n" +
            "+ Spring with annotations<br>\n" +
            "@Component 之后若无参数，则默认将其下的类名为bean的id";

    static String s5 = "21日晚8点，国足将在世预赛36强赛主场迎战韩国队。\n" +
            "19日上午，韩国队从仁川国际机场出发，经过三个多小时的飞行，于中午11点落地深圳宝安机场。20日下午3点，韩国队主教练克林斯曼和后卫金玟哉一起出席了赛前新闻发布会。\n" +
            "对于本场和中国队的比赛，克林斯曼表示，“很高兴来到中国，很兴奋迎来和中国队的比赛。我们知道这是一场艰难的较量，希望球队可以延续上一场（5比0击败新加坡）的表现。我们做好了准备，目前一切都很完美。”\n" +
            "曾经在中超北京国安效力的金玟哉表示，“距离我上一场来中国已经过去很久了，如教练所说，在中国对阵中国队不会容易，但希望可以拿到3分，我们球队做好了准备。”\n" +
            "对于是否会和队友分享一些中国队的信息，金玟哉说，“明天比赛球队的目标是不丢球，建立稳固的防守最差结果也是拿1分，首先要零封对手，这是目标。”";

    public static void quickStart() throws ApiException, NoApiKeyException, InputRequiredException {

        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        Conversation conversation = new Conversation();
        String prompt = s1 + s5;
        ConversationParam param = ConversationParam
                .builder()
                .model("qwen-max")
                .prompt(prompt)
                .build();
        ConversationResult result = conversation.call(param);
        System.out.println(result.getOutput().getText());
    }

    public static void qwenQuickStart()
            throws NoApiKeyException, ApiException, InputRequiredException {
        String PROMPT = s1 + s5;
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        Generation gen = new Generation();
        QwenParam param = QwenParam.builder().model("qwen-plus").prompt(PROMPT)
                .topP(0.8).build();
        GenerationResult result = gen.call(param);
        System.out.println(result.getOutput().getText());
    }

    public static void callWithMessage()
            throws NoApiKeyException, ApiException, InputRequiredException {
        Constants.apiKey = "sk-4ee81ca5526343e5b3f7c6b3baac0a85";
        String prompt = s1 + s5;
        Generation gen = new Generation();
        MessageManager msgManager = new MessageManager(10);
        Message systemMsg =
                Message.builder().role(Role.SYSTEM.getValue()).content("You are a helpful assistant.").build();
        Message userMsg = Message.builder().role(Role.USER.getValue()).content(prompt).build();
        msgManager.add(systemMsg);
        msgManager.add(userMsg);
        QwenParam param =
                QwenParam.builder().model("qwen-plus").messages(msgManager.get())
                        .resultFormat(QwenParam.ResultFormat.MESSAGE)
                        .topP(0.8)
                        .enableSearch(true)
                        .build();
        GenerationResult result = gen.call(param);
        System.out.println(result.getOutput().getChoices().get(0).getMessage().getContent());
    }

    public static void main(String[] args) {
        try {
            //quickStart();
            qwenQuickStart();
            //qwenQuickStartCallback();
            //callWithMessage();
        } catch (ApiException | NoApiKeyException | InputRequiredException e) {
            System.out.println(String.format("Exception %s", e.getMessage()));
        }
        System.exit(0);
    }
}
