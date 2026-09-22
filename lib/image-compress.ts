/**
 * Tiện ích nén ảnh trực tiếp trên trình duyệt bằng Canvas (Client-side Compression)
 * Giúp ảnh chụp từ camera điện thoại (5MB - 15MB) nén còn 200KB - 500KB
 * Đảm bảo tốc độ nộp báo cáo siêu tốc và không bao giờ bị quá hạn mức Vercel (10s)
 */
export async function compressImage(file: File, maxWidth = 1600, quality = 0.75): Promise<File> {
  // Nếu không phải là file ảnh (ví dụ file PDF, Word, Excel) thì giữ nguyên
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Tính toán tỷ lệ co lại nếu ảnh quá lớn
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback nếu trình duyệt không hỗ trợ canvas 2D
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Xuất ra định dạng JPEG nén chất lượng cao
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            console.log(
              `Ảnh đã được nén: ${(file.size / 1024).toFixed(1)} KB -> ${(compressedFile.size / 1024).toFixed(1)} KB`
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
