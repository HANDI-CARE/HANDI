import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styles from "./ImageMasker.module.css";

export interface Mask {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PredefinedMask extends Mask {
  active: boolean;
}

interface ImageMaskerProps {
  src: string;
  predefinedMasks?: PredefinedMask[];
  onPredefinedMasksChange?: (masks: PredefinedMask[]) => void;
  customMasks?: Mask[];
  onCustomMasksChange?: (masks: Mask[]) => void;
  onMaskHover?: (maskId: number | null) => void;
  highlightedMaskId?: number | null;
}

export interface ImageMaskerRef {
  getMaskedImage: () => Promise<string | undefined>;
}

const ImageMasker = forwardRef<ImageMaskerRef, ImageMaskerProps>(
  (
    {
      src,
      predefinedMasks = [],
      onPredefinedMasksChange,
      customMasks = [],
      onCustomMasksChange,
      onMaskHover,
      highlightedMaskId,
    },
    ref,
  ) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [drawingMask, setDrawingMask] = useState<Omit<Mask, "id"> | null>(
      null,
    );
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const didDrag = useRef(false); // Ref to track if a drag occurred
    const [adjustedPredefinedMasks, setAdjustedPredefinedMasks] = useState<
      PredefinedMask[]
    >([]);

    useImperativeHandle(ref, () => ({
      getMaskedImage: async () => {
        if (!imageRef.current || !canvasRef.current) {
          return;
        }

        const image = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return;
        }

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        ctx.drawImage(image, 0, 0);

        predefinedMasks
          .filter((mask) => mask.active)
          .forEach((mask) => {
            ctx.fillStyle = "black";
            ctx.fillRect(mask.x, mask.y, mask.width, mask.height);
          });

        customMasks.forEach((mask) => {
          ctx.fillStyle = "black";
          ctx.fillRect(mask.x, mask.y, mask.width, mask.height);
        });

        return canvas.toDataURL("image/png");
      },
    }));

    const getMousePos = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!imageRef.current) {
        return { x: 0, y: 0 };
      }
      const rect = imageRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // 이미지의 원본 크기와 화면에서 보여지는 크기의 비율을 계산
    const getScaleRatio = () => {
      if (!imageRef.current) {
        return { scaleX: 1, scaleY: 1 };
      }
      const image = imageRef.current;
      const rect = image.getBoundingClientRect();
      const ratio = {
        scaleX: rect.width / image.naturalWidth,
        scaleY: rect.height / image.naturalHeight,
      };
      return ratio;
    };

    // 원본 좌표를 화면 좌표로 변환
    const transformMaskToScreen = (mask: Mask) => {
      const { scaleX, scaleY } = getScaleRatio();
      return {
        ...mask,
        x: mask.x * scaleX,
        y: mask.y * scaleY,
        width: mask.width * scaleX,
        height: mask.height * scaleY,
      };
    };

    // 화면 좌표를 원본 좌표로 변환
    const transformScreenToOriginal = (screenMask: Omit<Mask, "id">) => {
      const { scaleX, scaleY } = getScaleRatio();
      return {
        ...screenMask,
        x: screenMask.x / scaleX,
        y: screenMask.y / scaleY,
        width: screenMask.width / scaleX,
        height: screenMask.height / scaleY,
      };
    };

    // 이미지 로드 시 predefinedMasks 좌표 보정
    useEffect(() => {
      const handleImageLoad = () => {
        if (imageRef.current && predefinedMasks.length > 0) {
          const { scaleX, scaleY } = getScaleRatio();
          const adjusted = predefinedMasks.map((mask) => ({
            ...mask,
            x: mask.x * scaleX,
            y: mask.y * scaleY,
            width: mask.width * scaleX,
            height: mask.height * scaleY,
          }));
          setAdjustedPredefinedMasks(adjusted);
        }
      };

      if (imageRef.current) {
        if (imageRef.current.complete) {
          handleImageLoad();
        } else {
          imageRef.current.addEventListener("load", handleImageLoad);
          return () => {
            imageRef.current?.removeEventListener("load", handleImageLoad);
          };
        }
      }
    }, [predefinedMasks]);

    const handleMouseDown = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      didDrag.current = false; // Reset drag flag
      setIsDrawing(true);
      const pos = getMousePos(e);
      setStartPos(pos);
      setDrawingMask({ ...pos, width: 0, height: 0 });
    };

    const handleMouseMove = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      if (!isDrawing) {
        return;
      }
      didDrag.current = true; // Set drag flag
      const currentPos = getMousePos(e);
      const newMask = {
        x: Math.min(startPos.x, currentPos.x),
        y: Math.min(startPos.y, currentPos.y),
        width: Math.abs(startPos.x - currentPos.x),
        height: Math.abs(startPos.y - currentPos.y),
      };
      setDrawingMask(newMask);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isDrawing) {
        return;
      }
      setIsDrawing(false);
      setDrawingMask(null);

      // Only create a new mask if the mouse was dragged
      if (didDrag.current) {
        const endPos = getMousePos(e);
        const screenMask = {
          x: Math.min(startPos.x, endPos.x),
          y: Math.min(startPos.y, endPos.y),
          width: Math.abs(startPos.x - endPos.x),
          height: Math.abs(startPos.y - endPos.y),
        };

        if (screenMask.width > 5 && screenMask.height > 5) {
          // 화면 좌표를 원본 좌표로 변환
          const originalMask = transformScreenToOriginal(screenMask);
          const newMask: Mask = {
            id: Date.now(),
            ...originalMask,
          };
          // Prevent tiny masks
          onCustomMasksChange?.([...customMasks, newMask]);
        }
      }
    };

    const handlePredefinedMaskClick = (mask: PredefinedMask) => {
      if (didDrag.current) return; // Don't fire on drag end
      const updatedMasks = predefinedMasks.map((m) =>
        m.id === mask.id ? { ...m, active: !m.active } : m,
      );
      onPredefinedMasksChange?.(updatedMasks);
    };

    const handleCustomMaskClick = (mask: Mask) => {
      if (didDrag.current) return; // Don't fire on drag end
      const updatedMasks = customMasks.filter((m) => m.id !== mask.id);
      onCustomMasksChange?.(updatedMasks);
    };

    return (
      <div
        className={styles.container}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            setIsDrawing(false);
            setDrawingMask(null);
          }
        }}
      >
        <img ref={imageRef} src={src} alt="Maskable" className={styles.image} />
        {adjustedPredefinedMasks.map((mask) => (
          <div
            key={mask.id}
            className={`${styles.mask} ${styles.predefined} ${
              mask.active ? styles.active : ""
            } ${highlightedMaskId === mask.id ? styles.highlight : ""}`}
            style={{
              left: mask.x,
              top: mask.y,
              width: mask.width,
              height: mask.height,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePredefinedMaskClick(mask);
            }}
            onMouseEnter={() => onMaskHover?.(mask.id)}
            onMouseLeave={() => onMaskHover?.(null)}
          />
        ))}
        {customMasks.map((mask) => {
          const screenMask = transformMaskToScreen(mask);
          return (
            <div
              key={mask.id}
              className={`${styles.mask} ${styles.custom} ${
                highlightedMaskId === mask.id ? styles.highlight : ""
              }`}
              style={{
                left: screenMask.x,
                top: screenMask.y,
                width: screenMask.width,
                height: screenMask.height,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleCustomMaskClick(mask);
              }}
              onMouseEnter={() => onMaskHover?.(mask.id)}
              onMouseLeave={() => onMaskHover?.(null)}
            />
          );
        })}
        {drawingMask && (
          <div
            className={`${styles.mask} ${styles.drawing}`}
            style={{
              left: drawingMask.x,
              top: drawingMask.y,
              width: drawingMask.width,
              height: drawingMask.height,
            }}
          />
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  },
);

export default ImageMasker;
