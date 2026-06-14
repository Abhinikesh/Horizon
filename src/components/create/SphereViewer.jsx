import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Plus, Trash2, Edit2, Compass } from 'lucide-react'

export default function SphereViewer({ imageUrl, hotspots, onHotspotsChange }) {
  const mountRef  = useRef(null)
  const stateRef  = useRef({
    scene: null, camera: null, renderer: null, sphere: null,
    isDragging: false, prevMouse: { x: 0, y: 0 },
    lat: 0, lon: 0, rafId: null,
    isAddingHotspot: false,
  })
  const [screenHotspots, setScreenHotspots] = useState([])
  const [isAdding,       setIsAdding]       = useState(false)
  const [editingIdx,     setEditingIdx]      = useState(null)
  const [editLabel,      setEditLabel]       = useState('')
  const [pendingLabel,   setPendingLabel]    = useState('')
  const [compassDeg,     setCompassDeg]      = useState(0)

  /* ── Setup Three.js ── */
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const s = stateRef.current

    const w = mount.clientWidth
    const h = mount.clientHeight || 300

    // Scene & camera
    s.scene    = new THREE.Scene()
    s.camera   = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
    s.camera.position.set(0, 0, 0)

    // Renderer
    s.renderer = new THREE.WebGLRenderer({ antialias: true })
    s.renderer.setSize(w, h)
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(s.renderer.domElement)

    // Inside-sphere
    const geo  = new THREE.SphereGeometry(500, 60, 40)
    geo.scale(-1, 1, 1)
    const tex  = new THREE.TextureLoader().load(imageUrl)
    const mat  = new THREE.MeshBasicMaterial({ map: tex })
    s.sphere   = new THREE.Mesh(geo, mat)
    s.scene.add(s.sphere)

    // Animate
    const animate = () => {
      s.rafId = requestAnimationFrame(animate)
      const phi   = THREE.MathUtils.degToRad(90 - s.lat)
      const theta = THREE.MathUtils.degToRad(s.lon)
      s.camera.lookAt(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      )
      setCompassDeg(-s.lon % 360)
      s.renderer.render(s.scene, s.camera)
      updateScreenPositions(s)
    }
    animate()

    // Resize observer
    const ro = new ResizeObserver(() => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight || 300
      s.camera.aspect = nw / nh
      s.camera.updateProjectionMatrix()
      s.renderer.setSize(nw, nh)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(s.rafId)
      ro.disconnect()
      tex.dispose(); geo.dispose(); mat.dispose()
      s.renderer.dispose()
      if (mount.contains(s.renderer.domElement)) mount.removeChild(s.renderer.domElement)
    }
  }, [imageUrl])

  /* ── Project hotspot 3D → 2D screen ── */
  const updateScreenPositions = s => {
    if (!s.renderer || !s.camera || !mountRef.current) return
    const w = mountRef.current.clientWidth
    const h = mountRef.current.clientHeight || 300
    setScreenHotspots(prev => prev.map(hs => {
      const vec = new THREE.Vector3(hs.x3, hs.y3, hs.z3)
      vec.project(s.camera)
      return {
        ...hs,
        sx: (vec.x * 0.5 + 0.5) * w,
        sy: (-vec.y * 0.5 + 0.5) * h,
        visible: vec.z < 1,
      }
    }))
  }

  /* ── Mouse / Touch drag ── */
  const onPointerDown = e => {
    const s = stateRef.current
    s.isDragging = true
    s.prevMouse  = { x: e.clientX ?? e.touches[0].clientX, y: e.clientY ?? e.touches[0].clientY }
  }
  const onPointerMove = e => {
    const s = stateRef.current
    if (!s.isDragging) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX
    const cy = e.clientY ?? e.touches?.[0]?.clientY
    if (cx == null) return
    const dx = cx - s.prevMouse.x
    const dy = cy - s.prevMouse.y
    s.lat = Math.max(-85, Math.min(85, s.lat - dy * 0.2))
    s.lon -= dx * 0.2
    s.prevMouse = { x: cx, y: cy }
  }
  const onPointerUp = e => {
    const s = stateRef.current
    if (!s.isDragging) return
    s.isDragging = false

    // Hotspot placement click (no movement)
    if (s.isAddingHotspot) {
      const rect  = mountRef.current.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / rect.width  * 2 - 1
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const dir = new THREE.Vector3(mx, my, 0.5).unproject(s.camera).sub(s.camera.position).normalize()
      const hs = { id: Date.now(), label: '', x3: dir.x * 500, y3: dir.y * 500, z3: dir.z * 500, sx: 0, sy: 0, visible: true }
      setScreenHotspots(prev => [...prev, hs])
      const newHs = { id: hs.id, label: 'New Hotspot', position: [hs.x3, hs.y3, hs.z3] }
      onHotspotsChange([...hotspots, newHs])
      setEditingIdx(hs.id)
      setEditLabel('New Hotspot')
      s.isAddingHotspot = false
      setIsAdding(false)
    }
  }

  const startAdding = () => {
    stateRef.current.isAddingHotspot = true
    setIsAdding(true)
  }

  const saveLabel = (id) => {
    setScreenHotspots(prev => prev.map(h => h.id === id ? { ...h, label: editLabel } : h))
    onHotspotsChange(hotspots.map(h => h.id === id ? { ...h, label: editLabel } : h))
    setEditingIdx(null)
  }

  const deleteHotspot = id => {
    setScreenHotspots(prev => prev.filter(h => h.id !== id))
    onHotspotsChange(hotspots.filter(h => h.id !== id))
  }

  return (
    <div className="space-y-3">
      {/* Sphere container */}
      <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ aspectRatio: '16/9' }}>
        {/* Three.js mount */}
        <div
          ref={mountRef}
          className="w-full h-full"
          style={{ cursor: isAdding ? 'crosshair' : 'grab' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={() => { stateRef.current.isDragging = false }}
          onTouchStart={e => onPointerDown(e.touches[0])}
          onTouchMove={e => onPointerMove(e.touches[0])}
          onTouchEnd={onPointerUp}
        />

        {/* Drag hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 rounded-full pointer-events-none">
          <p className="text-white text-xs">← Drag to explore →</p>
        </div>

        {/* Compass */}
        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 border border-white/20 flex items-center justify-center pointer-events-none">
          <Compass
            size={18}
            className="text-white"
            style={{ transform: `rotate(${compassDeg}deg)`, transition: 'transform 0.1s linear' }}
          />
        </div>

        {/* Adding mode hint */}
        {isAdding && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-blue-600 rounded-full">
            <p className="text-white text-xs font-semibold">Click to place hotspot</p>
          </div>
        )}

        {/* CSS hotspot overlays */}
        {screenHotspots.map(hs => hs.visible && (
          <div
            key={hs.id}
            className="absolute pointer-events-none"
            style={{ left: hs.sx, top: hs.sy, transform: 'translate(-50%,-50%)' }}
          >
            <span className="absolute -inset-1.5 rounded-full bg-blue-400/30 animate-ping" />
            <span className="relative flex w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
            {hs.label && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white border border-gray-200 rounded shadow-sm whitespace-nowrap">
                <span className="text-[11px] text-gray-700 font-medium">{hs.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hotspot controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Hotspots</p>
          <button
            onClick={startAdding}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isAdding
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Plus size={13} />
            {isAdding ? 'Click on sphere…' : 'Add Hotspot'}
          </button>
        </div>

        {/* Label editor */}
        {editingIdx !== null && (
          <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              autoFocus
              type="text"
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveLabel(editingIdx)}
              placeholder="Enter hotspot label"
              className="form-input flex-1 text-xs py-1.5"
            />
            <button onClick={() => saveLabel(editingIdx)} className="btn-primary text-xs px-3 py-1.5">Save</button>
          </div>
        )}

        {/* Hotspot list */}
        {screenHotspots.length > 0 ? (
          <ul className="space-y-1.5">
            {screenHotspots.map(hs => (
              <li key={hs.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-100 bg-gray-50">
                <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                <span className="text-xs text-gray-700 flex-1 truncate">{hs.label || 'Unnamed hotspot'}</span>
                <button onClick={() => { setEditingIdx(hs.id); setEditLabel(hs.label || '') }} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteHotspot(hs.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 text-center py-2">No hotspots added yet</p>
        )}
      </div>
    </div>
  )
}
