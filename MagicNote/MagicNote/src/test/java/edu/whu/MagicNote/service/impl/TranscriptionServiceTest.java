package edu.whu.MagicNote.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TranscriptionServiceTest {
    TranscriptionService ts = new TranscriptionService();
    @Test
    void test(){
        String result =ts.transcribe("http://118.178.241.148:9000/test/test_1701493460970.mp3");
        System.out.println(result);
    }
}