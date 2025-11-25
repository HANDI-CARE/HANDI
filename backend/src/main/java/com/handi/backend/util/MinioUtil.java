package com.handi.backend.util;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MinioUtil {

   private final MinioClient minioClient;

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    @Value("${minio.bucket}")
    private String bucketName;

    // 가능한 확장자만 List로 만들기 ( png, jpg, pdf )
    @Value("${minio.allowed-extensions}")
    private List<String> allowedExtensions;


    // 문서 파일 업로드
    public String uploadFile(Integer seniorId, Integer documentId, MultipartFile file) throws Exception {
        try{
            String fileName = file.getOriginalFilename();
            if (!isValidFileExtension(fileName)) {
                throw new IllegalArgumentException("허용되지 않은 파일 확장자입니다. 허용 확장자: " + allowedExtensions);
            }

            String filePath = generateFilePath(seniorId, documentId, fileName);

            log.info("MiniO로 파일 업로드 시작, filePath={}", filePath);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filePath)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("MiniO 파일 업로드 완료 : filePath={}", filePath);
            return filePath;
        } catch (Exception e){
            log.error("파일 업로드 실패, fileName={}", file.getOriginalFilename(), e);
            throw new RuntimeException("파일 업로드에 실패했습니다. " + e.getMessage());
        }
    }

    // MiniO 에서 파일 삭제
    public void deleteFile(String filePath) {
        try {
            log.info("MinIO 파일 삭제 시작: bucket={}, filePath={}", bucketName, filePath);

            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filePath)
                            .build()
            );

            log.info("MinIO 파일 삭제 완료: filePath={}", filePath);

        } catch (Exception e) {
            log.error("MinIO 파일 삭제 실패: filePath={}", filePath, e);
            throw new RuntimeException("파일 삭제에 실패했습니다: " + e.getMessage(), e);
        }
    }


    // 파일 공개 접근 URL 생성
    public String generateFileUrl(String filePath) {
        // MinIO 공개 버킷의 직접 접근 URL 생성
        return String.format("%s/%s/%s", minioEndpoint, bucketName, filePath);
    }


    // 저장할 고유한 파일 경로
    private String generateFilePath(Integer seniorId, Integer documentId, String originalFileName) {
        // 현재 시간을 문자열로 변환 (파일명 중복 방지)
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        // 경로 생성: senior_1/documents_1/20250801_143025_검사결과.pdf
        return String.format("senior_%d/documents_%d/%s_%s", seniorId, documentId, timestamp, originalFileName);
    }


    // ---------------------------------------------------------------------------------------------------------

    // 처방전 파일 업로드
    public String uploadMedicationFile(Integer seniorId, Integer medicationId, MultipartFile file) throws Exception {
        try{
            String fileName = file.getOriginalFilename();
            if (!isValidFileExtension(fileName)) {
                throw new IllegalArgumentException("허용되지 않은 파일 확장자입니다. 허용 확장자: " + allowedExtensions);
            }

            String filePath = generateMedicationFilePath(seniorId, medicationId, fileName);

            log.info("MiniO로 파일 업로드 시작, filePath={}", filePath);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filePath)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("MiniO 파일 업로드 완료 : filePath={}", filePath);
            return filePath;
        } catch (Exception e){
            log.error("파일 업로드 실패, fileName={}", file.getOriginalFilename(), e);
            throw new RuntimeException("파일 업로드에 실패했습니다. " + e.getMessage());
        }
    }

    // 저장할 고유한 파일 경로
    private String generateMedicationFilePath(Integer seniorId, Integer medicationId, String originalFileName) {
        // 현재 시간을 문자열로 변환 (파일명 중복 방지)
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        // 경로 생성: senior_1/medication_1/20250801_143025_검사결과.pdf
        return String.format("senior_%d/medication_%d/%s_%s", seniorId, medicationId, timestamp, originalFileName);
    }

    
    // 확장자 검증
    public boolean isValidFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return false;
        }

        // 파일 확장자 추출 (대소문자 무시)
        String extension = getFileExtension(fileName).toLowerCase();

        // 가능한 확장자 목록과 비교
        return allowedExtensions.contains(extension);
    }

    // 파일 이름에서 확장자만 따로 추출하기
    public String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }

        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == fileName.length() - 1) {
            return "";
        }

        return fileName.substring(lastDotIndex + 1);
    }
}
