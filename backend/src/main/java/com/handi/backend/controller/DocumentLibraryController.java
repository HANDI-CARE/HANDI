package com.handi.backend.controller;

import com.handi.backend.dto.ai.document.DocumentMaskRequest;
import com.handi.backend.dto.ai.document.DocumentMaskResponse;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.document.library.DocumentResponseDto;
import com.handi.backend.dto.document.library.DocumentUploadRequestDto;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.DocumentLibraryService;
import com.handi.backend.service.FastApiService;
import com.handi.backend.util.PageableUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Document Library", description = "문서 관련")
public class DocumentLibraryController {

    private final DocumentLibraryService documentLibraryService;
    private final FastApiService fastApiService;

    @GetMapping("senior/{seniorId}")
    @Operation(summary = "✅ 환자별 문서 목록 조회", description = "특정 환자의 삭제되지 않은 모든 문서 조회")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<PageResponseDto<DocumentResponseDto>> getDocumentsById(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @PageableDefault(sort = {"documentName"}) Pageable pageable,
            @Parameter(description = "검색 키워드 (문서 제목에 포함된 문자열 검색)", example = "처방전") @RequestParam(required = false) String keyword,
            @Parameter(description = "정렬 기준 필드 (documentName: 이름, uploadedAt: 생성일시)", example = "documentName") @RequestParam(defaultValue = "documentName") String sortBy,
            @Parameter(description = "정렬 방향", example = "ASC") @RequestParam(defaultValue = "ASC") SortDirection sortDirection
    ) {
        log.info("전체 문서 목록 조회 요청 : seniorId = {}, pageable={}, keyword={}, sortBy={}, sortDirection={} ", seniorId, pageable, keyword, sortBy, sortDirection);


        Page<DocumentResponseDto> documentLibraryPage = documentLibraryService.getDocumentList(seniorId, keyword, PageableUtils.addSort(pageable,sortBy,sortDirection));

        log.info("총 문서 수 {}", documentLibraryPage.getTotalElements());

        return ResponseEntity.ok().body(PageResponseDto.success(documentLibraryPage));
    }


    @GetMapping("/{id}")
    @Operation(summary = "✅ 특정 문서 조회", description = "특정 문서 조회")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "문서를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<DocumentResponseDto>> getDocumentById(
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id) throws Exception {
        log.info("특정 문서 삭제 id={}", id);

        DocumentResponseDto result = documentLibraryService.getDocumentById(id);

        return ResponseEntity.ok().body(CommonResponseDto.success("문서 조회 성공", result));
    }


    @DeleteMapping("/{id}")
    @Operation(summary = "✅ 특정 문서 삭제", description = "특정 문서 삭제 기능")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "삭제 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "문서를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<?>> deleteDocumentById(
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id){
        log.info("특정 문서 삭제 id={}", id);

        documentLibraryService.deleteDocumentById(id);
        return ResponseEntity.ok().body(CommonResponseDto.success("문서 삭제 성공", null));
    }

    @PostMapping(consumes = "multipart/form-data", path = "seniors/{seniorId}")
    @Operation(summary = "✅ 문서 업로드", description = "환자 문서 업로드 API")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "업로드 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청 - 파일 없음"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<DocumentResponseDto>> uploadDocumentBySeniorId (
            @Parameter(description = "시니어 ID", example = "1", required = true) @PathVariable Integer seniorId,
            @Parameter(description = "업로드할 파일", required = true) @RequestPart("file") MultipartFile file,
            @Parameter(description = "파일명", required = true) @RequestPart("fileName") String fileName,
            @Parameter(description = "워드 박스 JSON", required = true) @RequestPart("word_boxes") String wordBoxes ) throws Exception {

        log.info("문서 업로드 요청, fileName={}, Type={}", fileName, file.getSize());

        if(file.isEmpty()){
            return ResponseEntity.badRequest().body(CommonResponseDto.error("파일이 없습니다"));
        }

        // DocumentUploadRequestDto 생성
        DocumentUploadRequestDto documentUploadRequestDto = new DocumentUploadRequestDto(fileName, file, wordBoxes);

        // 이미지 파일을 받아온다.
        DocumentMaskRequest fastApiRequest = new DocumentMaskRequest(file, wordBoxes);
        DocumentMaskResponse fastApiResponse = fastApiService.documentMask(fastApiRequest);

        DocumentResponseDto document = documentLibraryService.uploadFileBySeniorId(seniorId, documentUploadRequestDto, fastApiResponse);

        return ResponseEntity.ok().body(CommonResponseDto.success("파일이 업로드 되었습니다.", document));

    }


}
