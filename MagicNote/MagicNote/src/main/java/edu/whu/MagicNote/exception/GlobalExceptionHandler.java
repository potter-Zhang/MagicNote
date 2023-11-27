package edu.whu.MagicNote.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class GlobalExceptionHandler {
//
    @ExceptionHandler(TodoException.class)
    public ResponseEntity<ExceptionResponse> handleExceptions(TodoException exception, WebRequest webRequest) {
        ExceptionResponse response = new ExceptionResponse();
        response.setCode(exception.getCode());
        response.setMessage(exception.getMessage());
        ResponseEntity<ExceptionResponse> entity = new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        return entity;
    }

}
