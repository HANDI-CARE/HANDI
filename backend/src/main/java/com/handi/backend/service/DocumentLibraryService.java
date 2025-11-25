package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.ai.document.DocumentMaskResponse;
import com.handi.backend.dto.document.library.DocumentResponseDto;
import com.handi.backend.dto.document.library.DocumentUploadRequestDto;
import com.handi.backend.dto.observation.record.Senior;
import com.handi.backend.entity.DocumentLibrary;
import com.handi.backend.entity.Seniors;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.DocumentLibraryRepository;
import com.handi.backend.repository.SeniorsRepository;
import com.handi.backend.util.MinioUtil;
import com.handi.backend.util.FastAPIUtil;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentLibraryService {

    @Value("${minio.bucket}")
    private String bucketName;

    private final DateTimeConverter dateTimeConverter;
    private final SeniorsRepository seniorsRepository;
    private final DocumentLibraryRepository documentLibraryRepository;
    private final MinioUtil minioUtil;
    private final MinioClient minioClient;

    // 전체 문서 조회
    public Page<DocumentResponseDto> getDocumentList(Integer seniorId, String keyword, Pageable pageable) {
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId)
                .orElseThrow(()->new NotFoundException("해당 환자가 없습니다."));

        Page<DocumentLibrary> page;

        if (keyword == null || keyword.isEmpty()) {
            page = documentLibraryRepository.findBySeniorAndIsDeletedFalse(senior, pageable);
        } else {
            page = documentLibraryRepository.findBySeniorAndIsDeletedFalseAndDocumentNameContaining(senior, keyword, pageable);
        }


        return page.map(document -> {
            Senior seniorDto = new Senior(
                    senior.getId(),
                    senior.getName(),
                    senior.getGender(),
                    senior.getNote(),
                    LocalDate.now().getYear() - senior.getBirthDate().getYear() + 1
            );

            String presignedUrl;

            try {
                presignedUrl = minioClient.getPresignedObjectUrl(
                        GetPresignedObjectUrlArgs.builder()
                                .method(Method.GET)
                                .bucket(bucketName)
                                .object(document.getOriginalPhotoPaths())
                                .expiry(1, TimeUnit.DAYS)
                                .build()
                );
            } catch (Exception e) {
                throw new RuntimeException("해당 url에 문서가 존재하지 않습니다.");
            }

            return new DocumentResponseDto(
                    document.getId(),
                    seniorDto,
                    document.getDocumentName(),
                    presignedUrl,
                    dateTimeConverter.localDateTimeToString(document.getUploadedAt()),
                    dateTimeConverter.localDateTimeToString(document.getCreatedAt()),
                    dateTimeConverter.localDateTimeToString(document.getUpdatedAt())
            );
        });
    }

    public void deleteDocumentById(Integer id) {
        DocumentLibrary documentLibrary = documentLibraryRepository.findById(id).orElseThrow(()-> new NotFoundException("해당 문서가 존재하지 않습니다."));

        if(documentLibrary.getIsDeleted()){
            throw new NotFoundException("이미 삭제된 문서입니다");
        }

        documentLibrary.setIsDeleted(true);
        documentLibraryRepository.save(documentLibrary);

    }


    // 파일 업로드
    public DocumentResponseDto uploadFileBySeniorId(
            Integer seniorId,
            DocumentUploadRequestDto documentUploadRequestDto,
            DocumentMaskResponse maskedDocument) throws Exception{
        Seniors senior = seniorsRepository.findByIdAndIsDeletedFalse(seniorId).orElseThrow(
                ()-> new NotFoundException("환자가 없습니다."));


        DocumentLibrary documentLibrary = new DocumentLibrary();

        documentLibrary.setSenior(senior);
        documentLibrary.setDocumentName(documentUploadRequestDto.getFileName());

        documentLibrary.setUploadedAt(LocalDateTime.now());
        documentLibrary.setIsDeleted(false);

        DocumentLibrary doc = documentLibraryRepository.save(documentLibrary);

        // DocumentMaskResponse를 MultipartFile로 변환
        MultipartFile maskedFile = FastAPIUtil.convertToMultipartFile(maskedDocument);

        String filepath = minioUtil.uploadFile(seniorId, doc.getId(), maskedFile);
        doc.setOriginalPhotoPaths(filepath);

        log.info("filepath : " + filepath);

        documentLibraryRepository.save(documentLibrary);

        Senior seniorDto = new Senior();
        seniorDto.setId(seniorId);
        seniorDto.setName(senior.getName());
        seniorDto.setGender(senior.getGender());
        seniorDto.setNote(senior.getNote());
        seniorDto.setAge(LocalDate.now().getYear() - senior.getBirthDate().getYear() + 1);

        DocumentResponseDto result = new DocumentResponseDto();
        result.setDocumentId(doc.getId());
        result.setSenior(seniorDto);
        result.setDocumentName(doc.getDocumentName());
        result.setUploadedAt(dateTimeConverter.localDateTimeToString(LocalDateTime.now()));
        result.setOriginalPhotoPaths(doc.getOriginalPhotoPaths());
        result.setCreatedAt(dateTimeConverter.localDateTimeToString(doc.getCreatedAt()));
        result.setUpdatedAt(dateTimeConverter.localDateTimeToString(doc.getUpdatedAt()));

        return result;
    }


    public DocumentResponseDto getDocumentById(Integer id) throws Exception {
        DocumentLibrary documentLibrary = documentLibraryRepository.findById(id).orElseThrow(
                () -> new NotFoundException("해당 문서가 없습니다"));

        Seniors seniors = seniorsRepository.findByIdAndIsDeletedFalse(documentLibrary.getSenior().getId()).orElseThrow(
                () -> new NotFoundException("해당 환자가 없습니다.")
        );

        String presignedUrl = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)
                        .bucket(bucketName)
                        .object(documentLibrary.getOriginalPhotoPaths())
                        .expiry(1, TimeUnit.DAYS)
                        .build()
        );

        Senior seniorDto = new Senior();
        seniorDto.setId(seniors.getId());
        seniorDto.setName(seniors.getName());
        seniorDto.setGender(seniors.getGender());
        seniorDto.setNote(seniors.getNote());
        seniorDto.setAge(LocalDate.now().getYear() - seniors.getBirthDate().getYear() + 1);

        DocumentResponseDto dto = new DocumentResponseDto();
        dto.setDocumentId(documentLibrary.getId());
        dto.setDocumentName(documentLibrary.getDocumentName());
        dto.setSenior(seniorDto);
        dto.setUploadedAt(dateTimeConverter.localDateTimeToString(LocalDateTime.now()));
        dto.setOriginalPhotoPaths(presignedUrl);
        dto.setCreatedAt(dateTimeConverter.localDateTimeToString(documentLibrary.getCreatedAt()));
        dto.setUpdatedAt(dateTimeConverter.localDateTimeToString(documentLibrary.getUpdatedAt()));

        return dto;
    }
}
