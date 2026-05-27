import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check, Upload, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SignaturePadProps {
  value?: string;
  onChange?: (signature: string) => void;
  label?: string;
  disabled?: boolean;
  width?: number;
  height?: number;
}

export function SignaturePad({
  value,
  onChange,
  label,
  disabled = false,
  width = 300,
  height = 120,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [mode, setMode] = useState<"draw" | "upload">("draw");

  // Load existing signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasSignature(true);
    };
    img.src = value;
  }, [value]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || mode !== "draw") return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [disabled, getCoordinates, mode]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || mode !== "draw") return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, disabled, getCoordinates, mode]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas || !onChange) return;
    
    const signature = canvas.toDataURL("image/png");
    onChange(signature);
  }, [isDrawing, onChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange?.("");
  }, [onChange]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate dimensions to fit the image within canvas while maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;
        
        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }
        
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        setHasSignature(true);
        
        const signature = canvas.toDataURL("image/png");
        onChange?.(signature);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onChange]);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}
      
      {/* Mode Toggle */}
      {!disabled && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button
            type="button"
            variant={mode === "draw" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("draw")}
            className="gap-1.5 h-7 text-xs"
          >
            <Pencil className="w-3 h-3" />
            Draw
          </Button>
          <Button
            type="button"
            variant={mode === "upload" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("upload")}
            className="gap-1.5 h-7 text-xs"
          >
            <Upload className="w-3 h-3" />
            Upload
          </Button>
        </div>
      )}
      
      <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`w-full touch-none ${
            disabled 
              ? "opacity-50 cursor-not-allowed" 
              : mode === "draw" 
                ? "cursor-crosshair" 
                : "cursor-default"
          }`}
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Upload overlay when in upload mode and no signature */}
        {mode === "upload" && !hasSignature && !disabled && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={triggerFileUpload}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload signature</p>
            <p className="text-xs text-muted-foreground/70">PNG, JPG up to 5MB</p>
          </div>
        )}
        
        {/* Signature line */}
        {mode === "draw" && (
          <>
            <div className="absolute bottom-6 left-4 right-4 border-b border-muted-foreground/40" />
            <p className="absolute bottom-1 left-4 text-[10px] text-muted-foreground">Sign above</p>
          </>
        )}
        
        {/* Status indicator */}
        {hasSignature && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            className="gap-2"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </Button>
          {mode === "upload" && hasSignature && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFileUpload}
              className="gap-2"
            >
              <Upload className="w-3 h-3" />
              Replace
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
