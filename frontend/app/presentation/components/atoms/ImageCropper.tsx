import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styles from "./ImageCropper.module.css";

// Stores crop coordinates as a ratio of image dimensions (0 to 1)
interface RelativeCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageCropperRef {
  getCroppedImage: () => string | null;
}

interface ImageCropperProps {
  src: string;
}

const ImageCropper = forwardRef<ImageCropperRef, ImageCropperProps>(
  ({ src }, ref) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [relativeCrop, setRelativeCrop] = useState<RelativeCrop | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      return { x, y };
    };

    useEffect(() => {
      const image = imageRef.current;

      const updateCanvasSize = () => {
        if (image) {
          setCanvasSize({
            width: image.clientWidth,
            height: image.clientHeight,
          });
        }
      };

      if (image) {
        image.addEventListener("load", updateCanvasSize);
        if (image.complete) {
          updateCanvasSize();
        }
      }

      window.addEventListener("resize", updateCanvasSize);

      return () => {
        if (image) {
          image.removeEventListener("load", updateCanvasSize);
        }
        window.removeEventListener("resize", updateCanvasSize);
      };
    }, [src]);

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (relativeCrop) {
        const cropInPixels = {
          x: relativeCrop.x * canvas.width,
          y: relativeCrop.y * canvas.height,
          width: relativeCrop.width * canvas.width,
          height: relativeCrop.height * canvas.height,
        };

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.clearRect(
          cropInPixels.x,
          cropInPixels.y,
          cropInPixels.width,
          cropInPixels.height,
        );
        ctx.strokeStyle = "white";
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          cropInPixels.x,
          cropInPixels.y,
          cropInPixels.width,
          cropInPixels.height,
        );
        ctx.setLineDash([]);
      }
    }, [relativeCrop, canvasSize]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const { x, y } = getCoords(e);
      startPos.current = { x, y };
      setRelativeCrop(null);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!isDragging || !startPos.current || !canvas || canvas.width === 0)
        return;
      const { x, y } = getCoords(e);

      const newRelativeCrop = {
        x: Math.min(startPos.current.x, x) / canvas.width,
        y: Math.min(startPos.current.y, y) / canvas.height,
        width: Math.abs(x - startPos.current.x) / canvas.width,
        height: Math.abs(y - startPos.current.y) / canvas.height,
      };
      setRelativeCrop(newRelativeCrop);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      startPos.current = null;
    };

    useImperativeHandle(ref, () => ({
      getCroppedImage: () => {
        const image = imageRef.current;
        if (!image) return null;

        // 크롭핑 영역이 지정되지 않았을 경우 원본 이미지 반환
        if (!relativeCrop) {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext("2d");

          if (!ctx) return null;

          ctx.drawImage(image, 0, 0);
          return canvas.toDataURL("image/png");
        }

        // 크롭핑 영역이 지정된 경우 크롭된 이미지 반환
        const canvas = document.createElement("canvas");
        canvas.width = relativeCrop.width * image.naturalWidth;
        canvas.height = relativeCrop.height * image.naturalHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        ctx.drawImage(
          image,
          relativeCrop.x * image.naturalWidth,
          relativeCrop.y * image.naturalHeight,
          relativeCrop.width * image.naturalWidth,
          relativeCrop.height * image.naturalHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        return canvas.toDataURL("image/png");
      },
    }));

    return (
      <div className={styles.cropperContainer}>
        <img
          ref={imageRef}
          src={src}
          alt="Source"
          className={styles.sourceImage}
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          className={styles.overlayCanvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
      </div>
    );
  },
);

ImageCropper.displayName = "ImageCropper";

export default ImageCropper;
