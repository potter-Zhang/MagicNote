package edu.whu.MagicNote.controller;


import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.service.INoteService;
import org.checkerframework.checker.units.qual.N;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/search")
public class SearchController {

    @Autowired
    INoteService noteService;

    // 根据用户id和搜索关键词搜索含有关键词的笔记
    @GetMapping("")
    public ResponseEntity<List<Note>> searchNotesByKeywords(int userid, String words){
        List<Note> notes = noteService.searchNotesByWords(userid, words);
        if(!notes.isEmpty())
            return ResponseEntity.ok(notes);
        else
            return ResponseEntity.noContent().build();
    }

}
