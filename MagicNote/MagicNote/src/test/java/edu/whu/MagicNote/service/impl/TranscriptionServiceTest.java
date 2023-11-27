package edu.whu.MagicNote.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TranscriptionServiceTest {
    TranscriptionService ts = new TranscriptionService();
    @Test
    void test(){
        String result =ts.transcribe("E:/cs/LLM/audio.mp3"
        );
        System.out.println(result);
    }

}