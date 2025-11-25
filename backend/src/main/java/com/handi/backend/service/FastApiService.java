package com.handi.backend.service;

import com.handi.backend.dto.ai.document.DocumentMaskRequest;
import com.handi.backend.dto.ai.document.DocumentDetectFromImageResponse;
import com.handi.backend.dto.ai.document.DocumentMaskResponse;
import com.handi.backend.dto.ai.drug.DrugSearchRequest;
import com.handi.backend.dto.ai.drug.DrugDetectByImageResponse;
import com.handi.backend.dto.ai.drug.DrugSearchByNameResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
public class FastApiService {
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${fastapi.http-url}")
    private String FastApiUrl;

    public DrugSearchByNameResponse searchByName(DrugSearchRequest request) {
        String endpoint = FastApiUrl + "/drug/search";

        log.info("FastAPI 요청 데이터 - query: '{}', limit: {}", request.getQuery(), request.getLimit());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<DrugSearchRequest> requestEntity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<DrugSearchByNameResponse> response = restTemplate.postForEntity(
                    endpoint,
                    requestEntity,
                    DrugSearchByNameResponse.class
            );
            log.info("FastAPI 응답 상태: {}", response.getStatusCode());
            return response.getBody();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("FastAPI HTTP 에러 - 상태코드: {}, 응답: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("FastAPI 호출 실패: {}", e.getMessage());
            throw e;
        }
    }

    public DrugDetectByImageResponse detectDrugFromImage(MultipartFile file) throws Exception {

        String endpoint = FastApiUrl + "/drug/detect-drug-from-image";

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        return restTemplate.postForObject(
                endpoint,
                requestEntity,
                DrugDetectByImageResponse.class
        );
    }

    public DocumentDetectFromImageResponse detectFromImage(MultipartFile file, boolean all) throws Exception {

        String endpoint = FastApiUrl + "/document";

        if (all) endpoint += "/detect-all-from-image";
        else endpoint += "/detect-entities-from-image";

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        return restTemplate.postForObject(
                endpoint,
                requestEntity,
                DocumentDetectFromImageResponse.class
        );
    }

    public DocumentMaskResponse documentMask(DocumentMaskRequest request) throws Exception {

        String endpoint = FastApiUrl + "/document/mask-image";

        ByteArrayResource fileResource = new ByteArrayResource(request.getFile().getBytes()) {
            @Override
            public String getFilename() {
                return request.getFile().getOriginalFilename();
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("word_boxes", request.getWord_boxes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<byte[]> response = restTemplate.postForEntity(
                endpoint,
                requestEntity,
                byte[].class
        );

        DocumentMaskResponse documentMaskResponse = new DocumentMaskResponse();
        documentMaskResponse.setImageData(response.getBody());
        documentMaskResponse.setContentType("image/jpeg");
        documentMaskResponse.setFilename("masked_image.jpg");

        return documentMaskResponse;
    }

}
