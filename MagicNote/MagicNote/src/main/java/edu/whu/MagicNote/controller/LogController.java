package edu.whu.MagicNote.controller;


import edu.whu.MagicNote.domain.Log;
import edu.whu.MagicNote.service.impl.LogServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 *  前端控制器
 * </p>
 *
 * @author Jerome
 * @since 2023-11-15
 */
@RestController
@RequestMapping("/log")
public class LogController {
    LogServiceImpl logService;
    @GetMapping("/getall/{id}")
    public ResponseEntity<List<Log>> getAllNotesByUserId(@PathVariable int id){
        List<Log> result = logService.getAllLogByUserId(id);
        return result==null? ResponseEntity.noContent().build():ResponseEntity.ok(result);
    }
}

