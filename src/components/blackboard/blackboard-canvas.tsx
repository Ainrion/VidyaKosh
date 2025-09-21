'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Palette, 
  Eraser, 
  Undo, 
  Redo, 
  Download, 
  Upload, 
  Square, 
  Circle, 
  Type, 
  Pen,
  MousePointer,
  Trash2,
  Save
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface Point {
  x: number
  y: number
}

interface DrawElement {
  type: 'pen' | 'rectangle' | 'circle' | 'text'
  points: Point[]
  color: string
  strokeWidth: number
  text?: string
  id: string
}

interface BlackboardCanvasProps {
  initialElements?: DrawElement[]
  onElementsChange?: (elements: DrawElement[]) => void
  onSave?: (elements: DrawElement[]) => void
  readOnly?: boolean
  className?: string
}

export function BlackboardCanvas({ 
  initialElements = [], 
  onElementsChange, 
  onSave,
  readOnly = false,
  className = ''
}: BlackboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<'pen' | 'rectangle' | 'circle' | 'text' | 'eraser'>('pen')
  const [currentColor, setCurrentColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [elements, setElements] = useState<DrawElement[]>(initialElements)
  const [history, setHistory] = useState<DrawElement[][]>([initialElements])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isTextMode, setIsTextMode] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<Point | null>(null)

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ]

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas()
  }, [elements, currentColor, strokeWidth])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all elements
    elements.forEach(element => {
      drawElement(ctx, element)
    })
  }, [elements])

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawElement) => {
    ctx.strokeStyle = element.color
    ctx.fillStyle = element.color
    ctx.lineWidth = element.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (element.type) {
      case 'pen':
        if (element.points.length > 1) {
          ctx.beginPath()
          ctx.moveTo(element.points[0].x, element.points[0].y)
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y)
          }
          ctx.stroke()
        }
        break

      case 'rectangle':
        if (element.points.length >= 2) {
          const start = element.points[0]
          const end = element.points[element.points.length - 1]
          const width = end.x - start.x
          const height = end.y - start.y
          ctx.strokeRect(start.x, start.y, width, height)
        }
        break

      case 'circle':
        if (element.points.length >= 2) {
          const start = element.points[0]
          const end = element.points[element.points.length - 1]
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
          ctx.beginPath()
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
        break

      case 'text':
        if (element.text && element.points.length > 0) {
          ctx.font = `${element.strokeWidth * 10}px Arial`
          ctx.fillText(element.text, element.points[0].x, element.points[0].y)
        }
        break
    }
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return

    const point = getMousePos(e)
    setIsDrawing(true)

    if (currentTool === 'text') {
      setIsTextMode(true)
      setTextPosition(point)
      return
    }

    const newElement: DrawElement = {
      type: currentTool === 'eraser' ? 'pen' : currentTool,
      points: [point],
      color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
      strokeWidth: currentTool === 'eraser' ? strokeWidth * 3 : strokeWidth,
      id: Date.now().toString()
    }

    setElements(prev => [...prev, newElement])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return

    const point = getMousePos(e)
    setElements(prev => {
      const newElements = [...prev]
      const lastElement = newElements[newElements.length - 1]
      if (lastElement) {
        lastElement.points.push(point)
      }
      return newElements
    })
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    // Save to history
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push([...elements])
      return newHistory.slice(-20) // Keep last 20 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 19))

    // Notify parent
    onElementsChange?.(elements)
  }

  const addText = () => {
    if (!textPosition || !textInput.trim()) return

    const newElement: DrawElement = {
      type: 'text',
      points: [textPosition],
      color: currentColor,
      strokeWidth: strokeWidth,
      text: textInput,
      id: Date.now().toString()
    }

    setElements(prev => [...prev, newElement])
    setIsTextMode(false)
    setTextInput('')
    setTextPosition(null)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setElements(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setElements(history[historyIndex + 1])
    }
  }

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setElements([])
      setHistory([[]])
      setHistoryIndex(0)
    }
  }

  const saveCanvas = () => {
    onSave?.(elements)
  }

  const exportCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `blackboard-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('pen')}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('rectangle')}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('circle')}
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('eraser')}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1">
            {colors.map(color => (
              <button
                key={color}
                className={`w-6 h-6 rounded border-2 ${
                  currentColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Size:</span>
            <Slider
              value={[strokeWidth]}
              onValueChange={([value]) => setStrokeWidth(value)}
              max={10}
              min={1}
              step={1}
              className="w-20"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={saveCanvas}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportCanvas}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ cursor: readOnly ? 'default' : 'crosshair' }}
        />
        
        {/* Text Input Modal */}
        {isTextMode && textPosition && (
          <div 
            className="absolute bg-white border border-gray-300 rounded shadow-lg p-2"
            style={{ left: textPosition.x, top: textPosition.y }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addText()}
              onBlur={addText}
              autoFocus
              className="border-none outline-none text-sm"
              placeholder="Enter text..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
