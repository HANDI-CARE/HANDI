package com.handi.backend.util;

import com.handi.backend.dto.ai.document.DocumentMaskResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

public class FastAPIUtil {
    
    public static MultipartFile convertToMultipartFile(DocumentMaskResponse response) {
        return new MockMultipartFile(
            "file",
            response.getFilename(),
            response.getContentType(),
            response.getImageData()
        );
    }
}