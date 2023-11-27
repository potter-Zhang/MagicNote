package edu.whu.MagicNote.controller;

import edu.whu.MagicNote.service.impl.TranscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transcribe")
public class TranscriptionController {
    @Autowired
    TranscriptionService ts;
    @GetMapping("/{filepath}")
    public ResponseEntity<String> transcribeAudio(@PathVariable String filepath) {
        String Result = ts.transcribe(filepath);
        return Result==null?ResponseEntity.noContent().build():ResponseEntity.ok(Result);
    }
}