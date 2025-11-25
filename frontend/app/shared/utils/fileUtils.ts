export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export function validateFileType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Base64 문자열을 File 객체로 변환
 * @param base64Data "data:<mime>;base64,<data>" 형식 또는 순수 base64 문자열
 * @param filename 파일명 (예: "image.png")
 * @returns File
 */
export function base64ToFile(base64Data: string, filename: string): File {
  // data:[<mediatype>][;base64],<data> 형태 분리
  const parts = base64Data.split(",");
  let mime = "";
  let b64 = "";

  if (parts.length === 2 && parts[0].includes("base64")) {
    mime = parts[0].match(/data:(.*);base64/)?.[1] || "";
    b64 = parts[1];
  } else {
    // 순수 base64만 넘어온 경우 기본 MIME 설정 (png)
    mime = "application/octet-stream";
    b64 = base64Data;
  }

  // Base64 디코딩
  const byteChars = atob(b64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  // Blob → File
  return new File([byteArray], filename, { type: mime });
}
