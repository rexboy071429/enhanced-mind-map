"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Minus, Link as LinkIcon, ZoomIn, ZoomOut } from "lucide-react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"

export default function Component() {
  const [categories, setCategories] = useState([
    "Work", "Personal", "Ideas", "Projects", "Goals",
    "Learning", "Health", "Finance", "Travel", "Books",
    "Movies", "Music", "Recipes", "Quotes"
  ])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [notes, setNotes] = useState([
    { id: 1, content: "Brainstorm new project ideas", x: 10, y: 10, width: 200, height: 150 },
    { id: 2, content: "Plan weekend getaway", x: 220, y: 10, width: 180, height: 130 },
    { id: 3, content: "Learn React hooks", x: 10, y: 170, width: 150, height: 100 },
    { id: 4, content: "Grocery shopping list", x: 170, y: 170, width: 230, height: 80 },
    { id: 5, content: "Write blog post", x: 410, y: 10, width: 190, height: 240 },
  ])
  const [connections, setConnections] = useState([])
  const [connecting, setConnecting] = useState(null)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const sidebarRef = useRef(null)
  const isDragging = useRef(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging.current) {
        const newWidth = e.clientX
        if (newWidth > 150 && newWidth < 400) {
          setSidebarWidth(newWidth)
        }
      }
      setMousePosition({ x: e.clientX, y: e.clientY })

      if (resizing) {
        const { id, direction } = resizing
        const note = notes.find(n => n.id === id)
        if (note) {
          let newWidth = note.width
          let newHeight = note.height
          if (direction.includes('right')) {
            newWidth = (e.clientX - pan.x) / zoom - note.x
          }
          if (direction.includes('bottom')) {
            newHeight = (e.clientY - pan.y) / zoom - note.y
          }
          setNotes(notes.map(n => n.id === id ? { ...n, width: Math.max(newWidth, 100), height: Math.max(newHeight, 50) } : n))
        }
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      setResizing(null)
      if (connecting) {
        setConnecting(null)
      }
    }

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setZoom(prevZoom => Math.min(Math.max(prevZoom - e.deltaY * 0.01, 0.5), 2))
      } else {
        setPan(prevPan => ({
          x: prevPan.x - e.deltaX,
          y: prevPan.y - e.deltaY
        }))
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('wheel', handleWheel)
    }
  }, [connecting, resizing, notes, zoom, pan])

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      content: "New note",
      x: -pan.x / zoom + Math.random() * 400,
      y: -pan.y / zoom + Math.random() * 300,
      width: 150,
      height: 100,
    }
    setNotes([...notes, newNote])
  }

  const updateNote = (id, newContent) => {
    setNotes(notes.map(note => note.id === id ? { ...note, content: newContent } : note))
  }

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id))
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id))
  }

  const startConnecting = (id) => {
    setConnecting(id)
  }

  const finishConnecting = (id) => {
    if (connecting && connecting !== id) {
      const existingConnection = connections.find(
        conn => (conn.from === connecting && conn.to === id) || (conn.from === id && conn.to === connecting)
      )
      if (existingConnection) {
        setConnections(connections.filter(conn => conn !== existingConnection))
      } else {
        setConnections([...connections, { from: connecting, to: id }])
      }
    }
    setConnecting(null)
  }

  const Cable = ({ from, to }) => {
    const fromNote = notes.find(note => note.id === from)
    const toNote = notes.find(note => note.id === to)
    if (!fromNote || !toNote) return null

    const startX = (fromNote.x + fromNote.width / 2) * zoom + pan.x
    const startY = (fromNote.y + fromNote.height) * zoom + pan.y
    const endX = (toNote.x + toNote.width / 2) * zoom + pan.x
    const endY = (toNote.y + toNote.height) * zoom + pan.y

    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    const curvature = 0.3
    const controlX1 = startX
    const controlY1 = startY + (endY - startY) * curvature
    const controlX2 = endX
    const controlY2 = endY - (endY - startY) * curvature

    return (
      <motion.path
        d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
        stroke="purple"
        strokeWidth={4 * zoom}
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    )
  }

  const ConnectButton = ({ noteId }) => {
    const controls = useDragControls()

    return (
      <motion.div
        drag
        dragControls={controls}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => startConnecting(noteId)}
        onDragEnd={(event, info) => {
          const droppedOnNote = notes.find(note => 
            info.point.x > note.x * zoom + pan.x && 
            info.point.x < (note.x + note.width) * zoom + pan.x && 
            info.point.y > note.y * zoom + pan.y && 
            info.point.y < (note.y + note.height) * zoom + pan.y &&
            note.id !== noteId
          )
          if (droppedOnNote) {
            finishConnecting(droppedOnNote.id)
          } else {
            setConnecting(null)
          }
        }}
        className="absolute bottom-1 left-1 cursor-move"
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="sm"
          variant="ghost"
          className="text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-100 to-pink-100 text-purple-900 overflow-hidden">
      <motion.div
        ref={sidebarRef}
        className="bg-gradient-to-b from-purple-800 to-purple-900 p-4 overflow-y-auto relative"
        style={{ width: `${sidebarWidth}px` }}
        initial={{ x: -sidebarWidth }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <h1 className="text-3xl font-bold mb-6 text-white">MindNote</h1>
        <Input
          className="mb-4 bg-purple-700 text-white placeholder-purple-300 border-purple-600"
          placeholder="New category"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              setCategories([...categories, e.target.value])
              e.target.value = ''
            }
          }}
        />
        {categories.map((category, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={selectedCategory === category ? "secondary" : "ghost"}
              className="w-full justify-start mb-2 text-purple-100 hover:text-white hover:bg-purple-700 transition-all duration-200"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          </motion.div>
        ))}
        <div
          className="absolute top-0 right-0 w-1 h-full bg-purple-600 cursor-col-resize"
          onMouseDown={() => {
            isDragging.current = true
          }}
        />
      </motion.div>
      <div className="flex-1 p-4 relative overflow-hidden">
        <motion.div
          className="absolute top-4 right-4 flex space-x-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200" onClick={addNote}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Note
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200" onClick={() => setZoom(zoom => Math.min(zoom + 0.1, 2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200" onClick={() => setZoom(zoom => Math.max(zoom - 0.1, 0.5))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </motion.div>
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <AnimatePresence>
            {connections.map((conn, index) => (
              <Cable key={index} from={conn.from} to={conn.to} />
            ))}
          </AnimatePresence>
          {connecting && (
            <motion.path
              d={`M ${(notes.find(note => note.id === connecting).x + notes.find(note => note.id === connecting).width / 2) * zoom + pan.x} 
                 ${(notes.find(note => note.id === connecting).y + notes.find(note => note.id === connecting).height) * zoom + pan.y} 
                 L ${mousePosition.x - sidebarWidth} ${mousePosition.y}`}
              stroke="purple"
              strokeWidth={4 * zoom}
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </svg>
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              className="absolute bg-white rounded-lg shadow-lg p-4 cursor-move"
              style={{
                width: note.width * zoom,
                height: note.height * zoom,
                x: note.x * zoom + pan.x,
                y: note.y * zoom + pan.y,
                fontSize: 14 * zoom,
              }}
              drag
              dragMomentum={false}
              onDrag={(e, info) => {
                const newX = note.x + info.delta.x / zoom
                const newY = note.y + info.delta.y / zoom
                setNotes(notes.map(n => n.id === note.id ? { ...n, x: newX, y: newY } : n))
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ boxShadow: "0px 0px 15px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <textarea
                className="w-full h-full resize-none border-none focus:outline-none"
                value={note.content}
                onChange={(e) => updateNote(note.id, e.target.value)}
                style={{ fontSize: `${14 * zoom}px` }}
              />
              <motion.div
                className="absolute top-1 right-1"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-800 transition-colors duration-200"
                  onClick={() => deleteNote(note.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </motion.div>
              <ConnectButton noteId={note.id} />
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                onMouseDown={() => setResizing({ id: note.id, direction: 'bottom-right' })}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize"
                onMouseDown={() => setResizing({ id: note.id, direction: 'bottom' })}
              />
              <div
                className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize"
                onMouseDown={() => setResizing({ id: note.id, direction: 'right' })}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
