package com.handi.backend.exception;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.ConstraintViolation;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.converter.HttpMessageNotReadableException;

/**
 * 예외 핸들러
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Not Found 핸들러
     *
     * @param e       NotFoundException
     * @param request 요청 타입을 찾기 위한 매개 변수
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(NotFoundException e, WebRequest request) {
        log.warn("[NotFoundException] {}", e.getMessage());

        String errorMessage = getErrorMessage(e.getMessage(), "요청한 리소스를 찾을 수 없습니다");

        if (isPageRequest(request)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(PageResponseDto.error(errorMessage));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(CommonResponseDto.error(errorMessage));
    }

    /**
     * 유효성 검증 에러 핸들러
     * MethodArgumentNotValidException -> `@Valid` 검증이 실패했을 때 자동으로 발생하는 예외
     *
     * @param e       MethodArgumentNotValidException
     * @param request 요청 타입을 찾기 위한 매개 변수
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException e, WebRequest request) {
        log.warn("[MethodArgumentNotValidException] {}", e.getMessage());

        BindingResult bindingResult = e.getBindingResult();
        StringBuilder errorMessages = new StringBuilder();

        for (FieldError fieldError : bindingResult.getFieldErrors()) {
            if (!errorMessages.isEmpty()) {
                errorMessages.append(", ");
            }
            errorMessages.append(fieldError.getDefaultMessage());
        }

        String errorMessage = getErrorMessage(errorMessages.toString(), "유효성 검사에 실패했습니다");

        if (isPageRequest(request)) {
            return ResponseEntity.badRequest()
                    .body(PageResponseDto.error(errorMessage));
        }

        return ResponseEntity.badRequest()
                .body(CommonResponseDto.error(errorMessage));
    }


    /**
     * 타입 변환 에러 핸들러
     * MethodArgumentTypeMismatchException -> Spring이 특정 파라미터를 요청하는 타입으로 변환하지 못할 때 발생하는 예외
     *
     * @param e       MethodArgumentTypeMismatchException
     * @param request 요청 타입을 찾기 위한 매개 변수
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentTypeMismatchException e, WebRequest request) {
        log.warn("[MethodArgumentTypeMismatchException] {}", e.getMessage());

        String errorMessage;

        // Converter에서 던진 IllegalArgumentException의 메시지를 추출
        if (e.getCause() instanceof IllegalArgumentException) {
            errorMessage = e.getCause().getMessage();
        } else {
            String parameterName = e.getName();
            String parameterValue = String.valueOf(e.getValue());
            String requiredType = e.getRequiredType().getSimpleName();
            errorMessage = String.format("파라미터 '%s'의 값 '%s'을(를) %s 타입으로 변환할 수 없습니다", parameterName, parameterValue, requiredType);
        }


        if (isPageRequest(request)) {
            return ResponseEntity.badRequest()
                    .body(PageResponseDto.error(errorMessage));
        }

        return ResponseEntity.badRequest()
                .body(CommonResponseDto.error(errorMessage));
    }


    /**
     * PathVariable, RequestParam 검증 에러 핸들러
     * ConstraintViolationException -> @Min, @Max 등 검증이 실패했을 때 발생하는 예외
     *
     * @param e       ConstraintViolationException
     * @param request 요청 타입을 찾기 위한 매개 변수
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolation(ConstraintViolationException e, WebRequest request) {
        log.warn("[ConstraintViolationException] {}", e.getMessage());

        StringBuilder errorMessages = new StringBuilder();
        for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
            if (!errorMessages.isEmpty()) {
                errorMessages.append(", ");
            }
            errorMessages.append(violation.getMessage());
        }

        String errorMessage = getErrorMessage(errorMessages.toString(), "요청 파라미터가 올바르지 않습니다");

        if (isPageRequest(request)) {
            return ResponseEntity.badRequest()
                    .body(PageResponseDto.error(errorMessage));
        }

        return ResponseEntity.badRequest()
                .body(CommonResponseDto.error(errorMessage));
    }

    /**
     * No Resource Found 핸들러
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResourceFound(NoResourceFoundException e, HttpServletRequest request) {
        if (request.getRequestURI().startsWith("/.well-known/")) {
            return ResponseEntity.notFound().build(); // or just return nothing
        }

        String errorMessage = getErrorMessage(e.getMessage(), "요청한 Resource가 없습니다.");

        // 나머지 로깅은 유지
        log.error("[NoResourceFoundException] 요청 정보(requestURI={})에 대한 Resource가 없음 : {}",
                request.getRequestURI(),
                e.getMessage(),
                e);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(CommonResponseDto.error(errorMessage));
    }

    /**
     * JSON 파싱 에러 핸들러
     * HttpMessageNotReadableException -> JSON 요청을 파싱할 수 없을 때 발생하는 예외
     *
     * @param e       HttpMessageNotReadableException
     * @param request 요청 타입을 찾기 위한 매개 변수
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleHttpMessageNotReadable(HttpMessageNotReadableException e, WebRequest request) {
        log.warn("[HttpMessageNotReadableException] {}", e.getMessage());


        String errorMessage = "JSON 형식이 올바르지 않습니다";

        // 원인 체인을 따라가면서 IllegalArgumentException 찾기
        Throwable cause = e.getCause();
        while (cause != null) {
            log.debug("Cause: {} - {}", cause.getClass().getSimpleName(), cause.getMessage());
            if (cause instanceof IllegalArgumentException) {
                errorMessage = cause.getMessage();
                break;
            }
            cause = cause.getCause();
        }

        // IllegalArgumentException을 찾지 못한 경우 기본 메시지
        if (cause == null && e.getMessage().contains("Cannot deserialize")) {
            errorMessage = "요청 데이터 형식이 올바르지 않습니다";
        }

        if (isPageRequest(request)) {
            return ResponseEntity.badRequest()
                    .body(PageResponseDto.error(errorMessage));
        }

        return ResponseEntity.badRequest()
                .body(CommonResponseDto.error(errorMessage));
    }

    /**
     * Bad Request 핸들러
     *
     * @param e       IllegalArgumentException
     * @param request 요청 타입을 찾기 위한 매개 변수
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException e, WebRequest request) {
        log.warn("[IllegalArgumentException] {}", e.getMessage());

        String errorMessage = getErrorMessage(e.getMessage(), "잘못된 요청입니다");

        if (isPageRequest(request)) {
            return ResponseEntity.badRequest()
                    .body(PageResponseDto.error(errorMessage));
        }

        return ResponseEntity.badRequest()
                .body(CommonResponseDto.error(errorMessage));
    }


    /**
     * Internal Server Error 핸들러
     *
     * @param e       Exception
     * @param request 요청 타입을 찾기 위한 매개 변수
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleInternalServerError(Exception e, WebRequest request) {
        log.error("[Exception] {}", e.getMessage(), e);

        String errorMessage = getErrorMessage(e.getMessage(), "서버 내부 오류가 발생했습니다");

        if (isPageRequest(request)) {
            return ResponseEntity.internalServerError()
                    .body(PageResponseDto.error(errorMessage));
        }

        return ResponseEntity.internalServerError()
                .body(CommonResponseDto.error(errorMessage));
    }

    /**
     * 페이지 요청인지 체크
     *
     * @param request WebRequest
     * @return boolean
     */
    private boolean isPageRequest(WebRequest request) {
        String uri = request.getDescription(false);
        return uri.contains("page=") || uri.contains("size=") || uri.contains("/list");
    }

    /**
     * 순수 에러 메시지 추출
     *
     * @param exceptionMessage 예외 메시지
     * @param defaultMessage   기본 메시지
     * @return message
     */
    private String getErrorMessage(String exceptionMessage, String defaultMessage) {
        return (exceptionMessage != null && !exceptionMessage.trim().isEmpty())
                ? exceptionMessage
                : defaultMessage;
    }
}