package edu.whu.MagicNote;

import io.github.asleepyfish.annotation.EnableChatGPT;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableChatGPT
public class MagicNoteApplication {
	public static void main(String[] args) {
		SpringApplication.	run(MagicNoteApplication.class, args);
	}
}
