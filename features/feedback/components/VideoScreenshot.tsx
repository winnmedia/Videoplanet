// =============================================================================
// VideoScreenshot Component - 비디오 스크린샷 추출 및 편집 컴포넌트
// =============================================================================

'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';

interface VideoScreenshotProps {
  videoElement: HTMLVideoElement | null; // 비디오 엘리먼트 참조
  currentTime?: number; // 현재 재생 시간
  onScreenshotTaken?: (screenshot: string, timestamp: string) => void; // 스크린샷 생성 콜백
  className?: string;
}

interface DrawingState {
  isDrawing: boolean;
  tool: 'pen' | 'rectangle' | 'arrow' | 'text';
  color: string;
  strokeWidth: number;
  startX: number;
  startY: number;
  currentPath: { x: number; y: number }[];
}

interface Annotation {
  id: string;
  type: 'pen' | 'rectangle' | 'arrow' | 'text';
  color: string;
  strokeWidth: number;
  points: { x: number; y: number }[];
  text?: string;
  textX?: number;
  textY?: number;
}

/**
 * 비디오 스크린샷 추출 및 편집 컴포넌트
 * - 현재 프레임 캡처
 * - 이미지 편집 (그리기, 도형, 텍스트 추가)
 * - 스크린샷 다운로드/공유
 */
const VideoScreenshot: React.FC<VideoScreenshotProps> = memo(({
  videoElement,
  currentTime = 0,
  onScreenshotTaken,
  className = '',
}) => {
  // 캔버스 및 UI 상태
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    tool: 'pen',
    color: '#ff0000',
    strokeWidth: 3,
    startX: 0,
    startY: 0,
    currentPath: [],
  });
  const [textInput, setTextInput] = useState<string>('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTextInput, setShowTextInput] = useState<boolean>(false);

  // 참조들
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // 사용 가능한 도구들
  const tools = [
    { id: 'pen', name: '펜', icon: '펜' },
    { id: 'rectangle', name: '사각형', icon: '사각형' },
    { id: 'arrow', name: '화살표', icon: '화살표' },
    { id: 'text', name: '텍스트', icon: '텍스트' },
  ] as const;

  // 사용 가능한 색상들
  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#000000', '#ffffff',
    '#ff8c00', '#9932cc', '#008000', '#dc143c',
  ];

  // 비디오 스크린샷 캡처
  const captureScreenshot = useCallback(async () => {
    if (!videoElement || !canvasRef.current) {
      console.error('Video element or canvas not available');
      return;
    }

    try {
      setIsCapturing(true);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // 캔버스 크기를 비디오 크기에 맞춤
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 360;

      // 비디오 프레임을 캔버스에 그리기
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // 캔버스를 이미지 데이터URL로 변환
      const screenshotDataUrl = canvas.toDataURL('image/png');
      setScreenshot(screenshotDataUrl);

      // 편집 모드 활성화
      setShowEditor(true);

      // 주석 초기화
      setAnnotations([]);
      setDrawingState(prev => ({ ...prev, currentPath: [] }));

      // 오버레이 캔버스 크기 설정
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = canvas.width;
        overlayCanvasRef.current.height = canvas.height;
      }

      console.log('Screenshot captured successfully');

    } catch (error) {
      console.error('Screenshot capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [videoElement]);

  // 현재 시간을 포맷된 문자열로 변환
  const formatTimestamp = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }, []);

  // 마우스 다운 이벤트 핸들러
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const scaleX = overlayCanvasRef.current.width / rect.width;
    const scaleY = overlayCanvasRef.current.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (drawingState.tool === 'text') {
      // 텍스트 도구: 클릭한 위치에 텍스트 입력창 표시
      setTextPosition({ x, y });
      setShowTextInput(true);
      setTextInput('');
      setTimeout(() => textInputRef.current?.focus(), 100);
      return;
    }

    // 다른 도구들: 그리기 시작
    setDrawingState(prev => ({
      ...prev,
      isDrawing: true,
      startX: x,
      startY: y,
      currentPath: drawingState.tool === 'pen' ? [{ x, y }] : [],
    }));
  }, [drawingState.tool]);

  // 마우스 이동 이벤트 핸들러
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing || !overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const scaleX = overlayCanvasRef.current.width / rect.width;
    const scaleY = overlayCanvasRef.current.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (drawingState.tool === 'pen') {
      // 펜 도구: 현재 경로에 점 추가
      setDrawingState(prev => ({
        ...prev,
        currentPath: [...prev.currentPath, { x, y }],
      }));
      
      // 실시간으로 그리기
      drawCurrentPath(x, y);
    } else {
      // 다른 도구들: 미리보기 그리기
      redrawCanvas();
      drawPreview(x, y);
    }
  }, [drawingState]);

  // 마우스 업 이벤트 핸들러
  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing || !overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const scaleX = overlayCanvasRef.current.width / rect.width;
    const scaleY = overlayCanvasRef.current.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // 주석 추가
    const newAnnotation: Annotation = {
      id: `annotation_${Date.now()}_${Math.random()}`,
      type: drawingState.tool,
      color: drawingState.color,
      strokeWidth: drawingState.strokeWidth,
      points: drawingState.tool === 'pen' 
        ? drawingState.currentPath 
        : [{ x: drawingState.startX, y: drawingState.startY }, { x, y }],
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    
    // 그리기 상태 초기화
    setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      currentPath: [],
    }));

    redrawCanvas();
  }, [drawingState]);

  // 현재 경로 그리기 (펜 도구용)
  const drawCurrentPath = useCallback((currentX: number, currentY: number) => {
    if (!overlayCanvasRef.current) return;

    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const path = drawingState.currentPath;
    if (path.length < 2) return;

    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const prevPoint = path[path.length - 2];
    if (prevPoint) {
      ctx.moveTo(prevPoint.x, prevPoint.y);
    }
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  }, [drawingState]);

  // 미리보기 그리기
  const drawPreview = useCallback((currentX: number, currentY: number) => {
    if (!overlayCanvasRef.current) return;

    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.strokeWidth;
    ctx.lineCap = 'round';

    const startX = drawingState.startX;
    const startY = drawingState.startY;

    ctx.beginPath();

    switch (drawingState.tool) {
      case 'rectangle':
        ctx.rect(startX, startY, currentX - startX, currentY - startY);
        break;
      
      case 'arrow':
        // 화살표 그리기
        const angle = Math.atan2(currentY - startY, currentX - startX);
        const arrowLength = Math.sqrt((currentX - startX) ** 2 + (currentY - startY) ** 2);
        const arrowHeadLength = Math.min(arrowLength * 0.3, 20);
        
        // 선 그리기
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        
        // 화살표 머리 그리기
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(
          currentX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
          currentY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(
          currentX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
          currentY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
        );
        break;
    }

    ctx.stroke();
  }, [drawingState]);

  // 캔버스 다시 그리기
  const redrawCanvas = useCallback(() => {
    if (!overlayCanvasRef.current) return;

    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // 캔버스 지우기
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    // 모든 주석 다시 그리기
    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      switch (annotation.type) {
        case 'pen':
          if (annotation.points.length > 1) {
            const firstPoint = annotation.points[0];
            if (firstPoint) {
              ctx.moveTo(firstPoint.x, firstPoint.y);
            }
            for (let i = 1; i < annotation.points.length; i++) {
              const point = annotation.points[i];
              if (point) {
                ctx.lineTo(point.x, point.y);
              }
            }
          }
          break;

        case 'rectangle':
          if (annotation.points.length === 2) {
            const [start, end] = annotation.points;
            if (start && end) {
              ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
            }
          }
          break;

        case 'arrow':
          if (annotation.points.length === 2) {
            const [start, end] = annotation.points;
            if (start && end) {
              const angle = Math.atan2(end.y - start.y, end.x - start.x);
              const arrowLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
              const arrowHeadLength = Math.min(arrowLength * 0.3, 20);
              
              // 선 그리기
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
            
              // 화살표 머리 그리기
              ctx.moveTo(end.x, end.y);
              ctx.lineTo(
                end.x - arrowHeadLength * Math.cos(angle - Math.PI / 6),
                end.y - arrowHeadLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(end.x, end.y);
              ctx.lineTo(
                end.x - arrowHeadLength * Math.cos(angle + Math.PI / 6),
                end.y - arrowHeadLength * Math.sin(angle + Math.PI / 6)
              );
            }
          }
          break;

        case 'text':
          if (annotation.text && annotation.textX !== undefined && annotation.textY !== undefined) {
            ctx.fillStyle = annotation.color;
            ctx.font = `${annotation.strokeWidth * 5}px Arial`;
            ctx.fillText(annotation.text, annotation.textX, annotation.textY);
          }
          break;
      }

      if (annotation.type !== 'text') {
        ctx.stroke();
      }
    });
  }, [annotations]);

  // 텍스트 추가
  const addText = useCallback(() => {
    if (!textInput.trim() || !textPosition) return;

    const newAnnotation: Annotation = {
      id: `text_${Date.now()}_${Math.random()}`,
      type: 'text',
      color: drawingState.color,
      strokeWidth: drawingState.strokeWidth,
      points: [],
      text: textInput,
      textX: textPosition.x,
      textY: textPosition.y,
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setShowTextInput(false);
    setTextInput('');
    setTextPosition(null);
    redrawCanvas();
  }, [textInput, textPosition, drawingState]);

  // 주석 취소 (실행 취소)
  const undoLastAnnotation = useCallback(() => {
    setAnnotations(prev => prev.slice(0, -1));
    setTimeout(redrawCanvas, 10);
  }, [redrawCanvas]);

  // 모든 주석 지우기
  const clearAllAnnotations = useCallback(() => {
    setAnnotations([]);
    setTimeout(redrawCanvas, 10);
  }, [redrawCanvas]);

  // 최종 이미지 생성 및 다운로드
  const generateFinalImage = useCallback(async (): Promise<string> => {
    if (!screenshot || !screenshotCanvasRef.current || !overlayCanvasRef.current) {
      throw new Error('Screenshot or canvas not available');
    }

    const finalCanvas = screenshotCanvasRef.current;
    const ctx = finalCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // 원본 스크린샷 크기 설정
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        finalCanvas.width = img.width;
        finalCanvas.height = img.height;

        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 주석 레이어 그리기
        ctx.drawImage(overlayCanvasRef.current!, 0, 0);

        // 최종 이미지 데이터URL 생성
        const finalImageDataUrl = finalCanvas.toDataURL('image/png');
        resolve(finalImageDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load screenshot image'));
      };

      img.src = screenshot;
    });
  }, [screenshot]);

  // 스크린샷 다운로드
  const downloadScreenshot = useCallback(async () => {
    try {
      const finalImageDataUrl = await generateFinalImage();
      const timestamp = formatTimestamp(currentTime);
      const filename = `screenshot_${timestamp.replace(/:/g, '-')}_${Date.now()}.png`;

      // 다운로드 링크 생성
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = finalImageDataUrl;
        downloadLinkRef.current.download = filename;
        downloadLinkRef.current.click();
      }

      console.log('Screenshot downloaded:', filename);
    } catch (error) {
      console.error('Download error:', error);
    }
  }, [generateFinalImage, currentTime, formatTimestamp]);

  // 스크린샷 공유 (클립보드)
  const shareScreenshot = useCallback(async () => {
    try {
      const finalImageDataUrl = await generateFinalImage();
      
      // 클립보드 API 지원 확인
      if (navigator.clipboard && window.ClipboardItem) {
        // Data URL을 Blob으로 변환
        const response = await fetch(finalImageDataUrl);
        const blob = await response.blob();
        
        const clipboardItem = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([clipboardItem]);
        
        console.log('Screenshot copied to clipboard');
        alert('스크린샷이 클립보드에 복사되었습니다!');
      } else {
        // Fallback: 이미지 데이터 URL 텍스트로 복사
        await navigator.clipboard.writeText(finalImageDataUrl);
        console.log('Screenshot data URL copied to clipboard');
        alert('스크린샷 데이터가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('클립보드 복사에 실패했습니다.');
    }
  }, [generateFinalImage]);

  // 스크린샷 제출 (피드백과 함께)
  const submitScreenshot = useCallback(async () => {
    try {
      const finalImageDataUrl = await generateFinalImage();
      const timestamp = formatTimestamp(currentTime);
      
      if (onScreenshotTaken) {
        onScreenshotTaken(finalImageDataUrl, timestamp);
      }

      // 편집 모드 종료
      setShowEditor(false);
      setScreenshot(null);
      setAnnotations([]);
      
      console.log('Screenshot submitted with timestamp:', timestamp);
    } catch (error) {
      console.error('Submit error:', error);
    }
  }, [generateFinalImage, currentTime, formatTimestamp, onScreenshotTaken]);

  // 편집 취소
  const cancelEdit = useCallback(() => {
    setShowEditor(false);
    setScreenshot(null);
    setAnnotations([]);
    setShowTextInput(false);
    setTextInput('');
    setTextPosition(null);
  }, []);

  // 텍스트 입력 키보드 이벤트
  const handleTextInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addText();
    } else if (event.key === 'Escape') {
      setShowTextInput(false);
      setTextInput('');
      setTextPosition(null);
    }
  }, [addText]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showEditor) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            undoLastAnnotation();
            break;
          case 's':
            event.preventDefault();
            downloadScreenshot();
            break;
          case 'c':
            event.preventDefault();
            shareScreenshot();
            break;
        }
      }

      // 도구 선택 단축키
      switch (event.key) {
        case '1':
          setDrawingState(prev => ({ ...prev, tool: 'pen' }));
          break;
        case '2':
          setDrawingState(prev => ({ ...prev, tool: 'rectangle' }));
          break;
        case '3':
          setDrawingState(prev => ({ ...prev, tool: 'arrow' }));
          break;
        case '4':
          setDrawingState(prev => ({ ...prev, tool: 'text' }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditor, undoLastAnnotation, downloadScreenshot, shareScreenshot]);

  // 캔버스 다시 그리기 (주석 변경시)
  useEffect(() => {
    if (showEditor) {
      redrawCanvas();
    }
  }, [annotations, showEditor, redrawCanvas]);

  return (
    <div className={`video-screenshot ${className}`}>
      {/* 스크린샷 캡처 버튼 */}
      {!showEditor && (
        <button
          onClick={captureScreenshot}
          disabled={!videoElement || isCapturing}
          className={`capture-btn ${isCapturing ? 'capturing' : ''}`}
          aria-label="현재 프레임 스크린샷 캡처"
          title="현재 재생 중인 프레임을 캡처합니다"
        >
          {isCapturing ? (
            <>
              <span className="loading-spinner" />
              캡처 중...
            </>
          ) : (
            <>
              스크린샷
            </>
          )}
        </button>
      )}

      {/* 스크린샷 편집기 */}
      {showEditor && screenshot && (
        <div className="screenshot-editor">
          {/* 편집 도구바 */}
          <div className="editor-toolbar">
            <div className="tool-section">
              <span className="section-label">도구:</span>
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setDrawingState(prev => ({ ...prev, tool: tool.id }))}
                  className={`tool-btn ${drawingState.tool === tool.id ? 'active' : ''}`}
                  aria-label={tool.name}
                  title={`${tool.name} (${tools.findIndex(t => t.id === tool.id) + 1})`}
                >
                  {tool.icon}
                </button>
              ))}
            </div>

            <div className="color-section">
              <span className="section-label">색상:</span>
              <div className="color-palette">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setDrawingState(prev => ({ ...prev, color }))}
                    className={`color-btn ${drawingState.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`색상 ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="stroke-section">
              <span className="section-label">굵기:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={drawingState.strokeWidth}
                onChange={(e) => setDrawingState(prev => ({ ...prev, strokeWidth: parseInt(e.target.value) }))}
                className="stroke-slider"
                aria-label="선 굵기"
              />
              <span className="stroke-value">{drawingState.strokeWidth}px</span>
            </div>

            <div className="action-section">
              <button
                onClick={undoLastAnnotation}
                disabled={annotations.length === 0}
                className="action-btn"
                aria-label="실행 취소"
                title="실행 취소 (Ctrl+Z)"
              >
                ↶ 실행취소
              </button>
              <button
                onClick={clearAllAnnotations}
                disabled={annotations.length === 0}
                className="action-btn"
                aria-label="모두 지우기"
              >
                모두지우기
              </button>
            </div>
          </div>

          {/* 캔버스 영역 */}
          <div className="canvas-container">
            {/* 백그라운드 이미지 */}
            <img
              src={screenshot}
              alt="스크린샷"
              className="screenshot-image"
            />
            
            {/* 편집 오버레이 캔버스 */}
            <canvas
              ref={overlayCanvasRef}
              className="overlay-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />

            {/* 텍스트 입력 */}
            {showTextInput && textPosition && (
              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleTextInputKeyDown}
                onBlur={() => {
                  if (textInput.trim()) {
                    addText();
                  } else {
                    setShowTextInput(false);
                    setTextPosition(null);
                  }
                }}
                className="text-input"
                style={{
                  position: 'absolute',
                  left: `${(textPosition.x / (overlayCanvasRef.current?.width || 1)) * 100}%`,
                  top: `${(textPosition.y / (overlayCanvasRef.current?.height || 1)) * 100}%`,
                  fontSize: `${drawingState.strokeWidth * 5}px`,
                  color: drawingState.color,
                }}
                placeholder="텍스트 입력 후 Enter"
                autoFocus
              />
            )}
          </div>

          {/* 편집 액션 버튼들 */}
          <div className="editor-actions">
            <button
              onClick={downloadScreenshot}
              className="action-btn primary"
              aria-label="스크린샷 다운로드"
              title="스크린샷 다운로드 (Ctrl+S)"
            >
              다운로드
            </button>
            <button
              onClick={shareScreenshot}
              className="action-btn secondary"
              aria-label="클립보드에 복사"
              title="클립보드에 복사 (Ctrl+C)"
            >
              복사
            </button>
            {onScreenshotTaken && (
              <button
                onClick={submitScreenshot}
                className="action-btn primary"
                aria-label="피드백에 첨부"
              >
                피드백에 첨부
              </button>
            )}
            <button
              onClick={cancelEdit}
              className="action-btn"
              aria-label="편집 취소"
            >
              취소
            </button>
          </div>

          {/* 안내 텍스트 */}
          <div className="editor-help">
            <p>
              <strong>도구 단축키:</strong> 1(펜), 2(사각형), 3(화살표), 4(텍스트) |
              <strong> 편집:</strong> Ctrl+Z(실행취소), Ctrl+S(저장), Ctrl+C(복사)
            </p>
          </div>
        </div>
      )}

      {/* 숨겨진 캔버스들 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={screenshotCanvasRef} style={{ display: 'none' }} />
      
      {/* 숨겨진 다운로드 링크 */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />

      {/* 접근성을 위한 안내 텍스트 */}
      <div className="sr-only" aria-live="polite">
        {isCapturing && '스크린샷을 캡처하고 있습니다.'}
        {showEditor && '스크린샷 편집 모드입니다. 도구를 선택하고 이미지를 편집하세요.'}
      </div>
    </div>
  );
});

VideoScreenshot.displayName = 'VideoScreenshot';

export default VideoScreenshot;