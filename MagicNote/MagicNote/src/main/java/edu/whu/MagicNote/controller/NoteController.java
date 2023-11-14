package edu.whu.MagicNote.controller;


import edu.whu.MagicNote.domain.Note;
import edu.whu.MagicNote.service.impl.NoteServiceImpl;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <p>
 *  前端控制器
 * </p>
 *
 * @author susong
 * @since 2023-11-14
 */
@RestController
@RequestMapping("/note")
public class NoteController {
    @Autowired
    NoteServiceImpl noteService;
    //添加笔记
    @PostMapping("/add")
    public ResponseEntity<Note> addNote(@ApiParam("请求体")@RequestBody Note myNote){
        Note result=noteService.addNote(myNote);
        return ResponseEntity.ok(result);
    }
    //根据id删除笔记
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> removeNoteById(@PathVariable int id){
        noteService.removeNote(id);
        return ResponseEntity.ok().build();
    }
    //根据文件名删除笔记
    @DeleteMapping("/delete/{name}")
    public ResponseEntity<Void> removeNoteByName(@PathVariable String name){
        noteService.removeNote(name);
        return ResponseEntity.ok().build();
    }

    //更新笔记
    @PostMapping("/update")
    public ResponseEntity<Void> updateNote(@RequestBody Note myNote){
        noteService.updateNote(myNote);
        return ResponseEntity.ok().build();
    }
    //根据id查询笔记
    @GetMapping("/get/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable int id){
        Note result = noteService.getNote(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据文件名查询笔记
    @GetMapping("/get/{name}")
    public ResponseEntity<Note> getNoteByName(@PathVariable String name){
        Note result = noteService.getNote(name);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
    //根据用户id查询所有笔记
    @GetMapping("/getall/{id}")
    public ResponseEntity<List<Note>> getAllNotesByUserId(@PathVariable int id){
        List<Note> result = noteService.getAllNoteByUserId(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
}

