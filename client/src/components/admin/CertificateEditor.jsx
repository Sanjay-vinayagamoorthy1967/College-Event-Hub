import React, { useState, useEffect, useRef } from 'react';
import { FiBold, FiItalic, FiAlignLeft, FiAlignCenter, FiAlignRight, FiRotateCcw, FiRotateCw, FiGrid, FiPlus, FiTrash2, FiDownload, FiUploadCloud, FiEye, FiChevronsUp, FiChevronsDown, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const PLACEHOLDERS = [
  { placeholder: '{{participant_name}}', id: 'participant_name', label: 'Participant Name' },
  { placeholder: '{{college_name}}', id: 'college_name', label: 'College Name' },
  { placeholder: '{{department}}', id: 'department', label: 'Department' },
  { placeholder: '{{event_name}}', id: 'event_name', label: 'Event Name' },
  { placeholder: '{{event_date}}', id: 'event_date', label: 'Event Date' },
  { placeholder: '{{venue}}', id: 'venue', label: 'Venue Location' },
  { placeholder: '{{position}}', id: 'position', label: 'Position / Rank' },
  { placeholder: '{{certificate_number}}', id: 'certificate_number', label: 'Certificate Number' },
  { placeholder: '{{issue_date}}', id: 'issue_date', label: 'Issue Date' },
  { placeholder: '{{coordinator_name}}', id: 'coordinator_name', label: 'Coordinator Name' },
  { placeholder: '{{organization_name}}', id: 'organization_name', label: 'Organization Name' },
  { placeholder: '{{qr_code}}', id: 'qr_code', label: 'QR Code' }
];

const FONTS = ['Times New Roman', 'Arial', 'Helvetica', 'Courier New', 'Georgia', 'Verdana'];

// Virtual Canvas Dimensions
const V_WIDTH = 1123;
const V_HEIGHT = 794;

export default function CertificateEditor({ templateUrl, onChange, initialData, onAutoSave }) {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10); // 5px, 10px, 20px
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'

  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const rotateRef = useRef(null);
  const elementsRef = useRef([]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Initialize from initialData
  useEffect(() => {
    if (initialData) {
      const layoutObj = initialData.layout || initialData.placeholderLayout || {};
      let loadedPlaceholders = [];

      if (Object.keys(layoutObj).length > 0) {
        loadedPlaceholders = Object.keys(layoutObj).map(key => {
          const phInfo = PLACEHOLDERS.find(p => p.id === key);
          const val = layoutObj[key];
          return {
            id: key,
            type: 'placeholder',
            name: phInfo ? phInfo.placeholder : `{{${key}}}`,
            x: Number(val.x) || 100,
            y: Number(val.y) || 100,
            w: Number(val.width || val.w) || 200,
            h: Number(val.height || val.h) || 40,
            rotation: Number(val.rotation) || 0,
            font: val.fontFamily || val.font || 'Times New Roman',
            fontSize: Number(val.fontSize) || 18,
            bold: val.bold || false,
            italic: val.italic || false,
            color: val.color || '#000000',
            align: val.align || 'center',
            letterSpacing: Number(val.letterSpacing) || 0,
            lineHeight: Number(val.lineHeight) || 1.2
          };
        });
      } else {
        loadedPlaceholders = (initialData.placeholders || []).map(p => ({
          ...p,
          type: 'placeholder',
          id: p.id || p.name?.replace(/[{}]/g, '') || `el-${Date.now()}`
        }));
      }

      // Pre-populate sensible defaults if empty
      if (loadedPlaceholders.length === 0) {
        loadedPlaceholders = PLACEHOLDERS.map(ph => {
          let x = 350, y = 300, w = 350, h = 50, fontSize = 24, bold = false, align = 'center';
          
          if (ph.id === 'participant_name') {
            x = 300; y = 340; w = 523; h = 50; fontSize = 32; bold = true;
          } else if (ph.id === 'college_name') {
            x = 200; y = 410; w = 723; h = 40; fontSize = 18;
          } else if (ph.id === 'department') {
            x = 200; y = 445; w = 723; h = 35; fontSize = 16;
          } else if (ph.id === 'event_name') {
            x = 250; y = 480; w = 623; h = 45; fontSize = 24; bold = true;
          } else if (ph.id === 'position') {
            x = 300; y = 290; w = 523; h = 40; fontSize = 20; bold = true;
          } else if (ph.id === 'event_date') {
            x = 250; y = 545; w = 280; h = 35; fontSize = 16;
          } else if (ph.id === 'venue') {
            x = 593; y = 545; w = 280; h = 35; fontSize = 16;
          } else if (ph.id === 'certificate_number') {
            x = 60; y = 80; w = 200; h = 30; fontSize = 12; bold = true; align = 'left';
          } else if (ph.id === 'issue_date') {
            x = 150; y = 680; w = 200; h = 30; fontSize = 14;
          } else if (ph.id === 'coordinator_name') {
            x = 773; y = 680; w = 200; h = 30; fontSize = 14; bold = true;
          } else if (ph.id === 'organization_name') {
            x = 461; y = 680; w = 200; h = 30; fontSize = 14;
          } else if (ph.id === 'qr_code') {
            x = 930; y = 70; w = 120; h = 120; fontSize = 12;
          }

          return {
            id: ph.id,
            type: 'placeholder',
            name: ph.placeholder,
            x,
            y,
            w,
            h,
            rotation: 0,
            font: 'Times New Roman',
            fontSize,
            bold,
            italic: false,
            color: '#000000',
            align,
            letterSpacing: 0,
            lineHeight: 1.2
          };
        });
      }

      const merged = [
        ...loadedPlaceholders,
        ...(initialData.customTexts || []).map(t => ({ ...t, type: 'text' })),
        ...(initialData.customImages || []).map(i => ({ ...i, type: 'image' }))
      ];

      const normalized = merged.map(el => ({
        ...el,
        id: el.id || el.name?.replace(/[{}]/g, '') || `el-${Date.now()}-${Math.random()}`,
        rotation: el.rotation || 0,
        x: Number(el.x) || 100,
        y: Number(el.y) || 100,
        w: Number(el.width || el.w) || 200,
        h: Number(el.height || el.h) || 40
      }));

      setElements(normalized);
      setHistory([JSON.stringify(normalized)]);
      setHistoryIndex(0);
      setShowGrid(initialData.showGrid || false);
      setSnapToGrid(initialData.snapToGrid || false);
      setZoom(initialData.zoom || 100);
    }
  }, [initialData]);

  // Handle autosave
  const triggerChangeAndSave = (currElements) => {
    const placeholders = currElements.filter(e => e.type === 'placeholder').map(p => ({ ...p, width: p.w, height: p.h }));
    const customTexts = currElements.filter(e => e.type === 'text').map(t => ({ ...t, width: t.w, height: t.h }));
    const customImages = currElements.filter(e => e.type === 'image').map(i => ({ ...i, width: i.w, height: i.h }));

    const layout = {};
    placeholders.forEach(p => {
      layout[p.id] = {
        x: p.x,
        y: p.y,
        width: p.w,
        height: p.h,
        fontSize: p.fontSize,
        fontFamily: p.font,
        color: p.color,
        bold: p.bold,
        italic: p.italic,
        align: p.align,
        rotation: p.rotation
      };
    });

    const config = {
      placeholders,
      customTexts,
      customImages,
      layout,
      showGrid,
      snapToGrid,
      zoom
    };

    onChange(config);

    if (onAutoSave) {
      setSaveStatus('saving');
      onAutoSave(config)
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('unsaved'));
    }
  };

  // Push to undo/redo history
  const updateState = (newElements) => {
    setElements(newElements);
    const serialized = JSON.stringify(newElements);
    const cleanHistory = history.slice(0, historyIndex + 1);
    setHistory([...cleanHistory, serialized]);
    setHistoryIndex(cleanHistory.length);

    triggerChangeAndSave(newElements);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevElements = JSON.parse(history[prevIdx]);
      setElements(prevElements);
      setHistoryIndex(prevIdx);
      triggerChangeAndSave(prevElements);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextElements = JSON.parse(history[nextIdx]);
      setElements(nextElements);
      setHistoryIndex(nextIdx);
      triggerChangeAndSave(nextElements);
    }
  };

  // Keyboard Shortcuts (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Add Unique Placeholder
  const addPlaceholder = (phId) => {
    const phInfo = PLACEHOLDERS.find(p => p.id === phId);
    if (!phInfo) return;

    if (elements.some(e => e.id === phId)) {
      toast.error(`${phInfo.label} is already added to the canvas.`);
      return;
    }

    const isQR = phId === 'qr_code';
    const newEl = {
      id: phId,
      type: 'placeholder',
      name: phInfo.placeholder,
      x: 350,
      y: 300,
      w: isQR ? 120 : 350,
      h: isQR ? 120 : 50,
      rotation: 0,
      font: 'Times New Roman',
      fontSize: isQR ? 12 : 24,
      bold: true,
      italic: false,
      color: '#000000',
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.2
    };

    updateState([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  // Add Custom Text
  const addCustomText = () => {
    const newEl = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: 'Custom Text Element',
      name: 'Custom Text',
      x: 350,
      y: 350,
      w: 300,
      h: 50,
      rotation: 0,
      font: 'Arial',
      fontSize: 20,
      bold: false,
      italic: false,
      color: '#000000',
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.2
    };

    updateState([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  // Add Custom Image (Logo, Signature, Seal)
  const addImageElement = async (e, imageType) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('template', file);

      toast.loading(`Uploading ${imageType}...`, { id: 'image_upload' });
      try {
        const res = await adminService.uploadTemplate(formData);
        const imageUrl = res.url;
        
        const isSig = imageType === 'signature';
        const newEl = {
          id: `image-${Date.now()}`,
          type: 'image',
          imageType,
          url: imageUrl,
          name: imageType.toUpperCase(),
          x: 450,
          y: 500,
          w: isSig ? 180 : 130,
          h: isSig ? 80 : 130,
          rotation: 0
        };

        updateState([...elements, newEl]);
        setSelectedId(newEl.id);
        toast.success(`${imageType} uploaded and added!`, { id: 'image_upload' });
      } catch (err) {
        toast.error(`Failed to upload ${imageType}`, { id: 'image_upload' });
      }
    }
  };

  // Remove element
  const removeElement = (id) => {
    const filtered = elements.filter(e => e.id !== id);
    updateState(filtered);
    setSelectedId(null);
  };

  // Duplicate element
  const duplicateElement = (id) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const isPlaceholder = el.type === 'placeholder';
    const newId = isPlaceholder ? `${el.id}_copy` : `${el.type}-${Date.now()}`;
    const newEl = {
      ...el,
      id: newId,
      x: Math.min(V_WIDTH - el.w, el.x + 30),
      y: Math.min(V_HEIGHT - el.h, el.y + 30)
    };
    updateState([...elements, newEl]);
    setSelectedId(newId);
  };

  // Dragging Handlers (Virtual Coordinate Space)
  const handleDragStart = (e, element) => {
    e.stopPropagation();
    setSelectedId(element.id);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRect.width / V_WIDTH;

    dragRef.current = {
      elementId: element.id,
      startX: e.clientX,
      startY: e.clientY,
      elStartX: element.x,
      elStartY: element.y,
      elW: element.w,
      elH: element.h,
      scale
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragRef.current) return;
    const { elementId, startX, startY, elStartX, elStartY, elW, elH, scale } = dragRef.current;

    const deltaX = (e.clientX - startX) / scale;
    const deltaY = (e.clientY - startY) / scale;

    let newX = elStartX + deltaX;
    let newY = elStartY + deltaY;

    // Boundary check (Keep inside 0 to Virtual Canvas limit)
    newX = Math.max(0, Math.min(V_WIDTH - elW, newX));
    newY = Math.max(0, Math.min(V_HEIGHT - elH, newY));

    // Snapping to Grid
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    setElements(prev => prev.map(el => el.id === elementId ? { ...el, x: newX, y: newY } : el));
  };

  const handleDragEnd = () => {
    if (dragRef.current) {
      updateState(elementsRef.current);
      dragRef.current = null;
    }
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  // Resizing Handlers (Virtual Coordinate Space)
  const handleResizeStart = (e, element, handleType) => {
    e.stopPropagation();
    setSelectedId(element.id);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRect.width / V_WIDTH;

    resizeRef.current = {
      elementId: element.id,
      handleType,
      startX: e.clientX,
      startY: e.clientY,
      elStartW: element.w,
      elStartH: element.h,
      elStartX: element.x,
      elStartY: element.y,
      scale
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e) => {
    if (!resizeRef.current) return;
    const { elementId, handleType, startX, startY, elStartW, elStartH, elStartX, elStartY, scale } = resizeRef.current;

    const deltaX = (e.clientX - startX) / scale;
    const deltaY = (e.clientY - startY) / scale;

    let newW = elStartW;
    let newH = elStartH;
    let newX = elStartX;
    let newY = elStartY;

    const minW = 30;
    const minH = 15;

    if (handleType === 'se') {
      newW = Math.max(minW, elStartW + deltaX);
      newH = Math.max(minH, elStartH + deltaY);
    } else if (handleType === 'sw') {
      const tempW = elStartW - deltaX;
      if (tempW >= minW) {
        newW = tempW;
        newX = elStartX + deltaX;
      }
      newH = Math.max(minH, elStartH + deltaY);
    } else if (handleType === 'ne') {
      newW = Math.max(minW, elStartW + deltaX);
      const tempH = elStartH - deltaY;
      if (tempH >= minH) {
        newH = tempH;
        newY = elStartY + deltaY;
      }
    } else if (handleType === 'nw') {
      const tempW = elStartW - deltaX;
      if (tempW >= minW) {
        newW = tempW;
        newX = elStartX + deltaX;
      }
      const tempH = elStartH - deltaY;
      if (tempH >= minH) {
        newH = tempH;
        newY = elStartY + deltaY;
      }
    }

    // Boundary constraints check
    newW = Math.min(V_WIDTH - newX, newW);
    newH = Math.min(V_HEIGHT - newY, newH);

    setElements(prev => prev.map(el => el.id === elementId ? { ...el, x: newX, y: newY, w: newW, h: newH } : el));
  };

  const handleResizeEnd = () => {
    if (resizeRef.current) {
      updateState(elementsRef.current);
      resizeRef.current = null;
    }
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  };

  // Rotation Handlers
  const handleRotateStart = (e, element) => {
    e.stopPropagation();
    setSelectedId(element.id);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRect.width / V_WIDTH;

    // Calculate center point of the element in client screen space
    const centerScreenX = canvasRect.left + (element.x + element.w / 2) * scale;
    const centerScreenY = canvasRect.top + (element.y + element.h / 2) * scale;

    rotateRef.current = {
      elementId: element.id,
      centerX: centerScreenX,
      centerY: centerScreenY
    };

    window.addEventListener('mousemove', handleRotateMove);
    window.addEventListener('mouseup', handleRotateEnd);
  };

  const handleRotateMove = (e) => {
    if (!rotateRef.current) return;
    const { elementId, centerX, centerY } = rotateRef.current;

    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    // Align with top-facing handle (+90 deg offset)
    let deg = Math.round((rad * 180) / Math.PI) + 90;
    
    // Normalize to 0-359 range
    if (deg < 0) deg += 360;
    deg = deg % 360;

    // Snap rotation to 15deg increments if snapToGrid is enabled
    if (snapToGrid) {
      deg = Math.round(deg / 15) * 15;
    }

    setElements(prev => prev.map(el => el.id === elementId ? { ...el, rotation: deg } : el));
  };

  const handleRotateEnd = () => {
    if (rotateRef.current) {
      updateState(elementsRef.current);
      rotateRef.current = null;
    }
    window.removeEventListener('mousemove', handleRotateMove);
    window.removeEventListener('mouseup', handleRotateEnd);
  };

  // Layering Controls (Move elements inside Array)
  const moveLayer = (direction) => {
    if (!selectedId) return;
    const idx = elements.findIndex(e => e.id === selectedId);
    if (idx === -1) return;

    const copy = [...elements];
    const item = copy[idx];

    if (direction === 'to_front') {
      copy.splice(idx, 1);
      copy.push(item);
    } else if (direction === 'to_back') {
      copy.splice(idx, 1);
      copy.unshift(item);
    } else if (direction === 'forward') {
      if (idx === elements.length - 1) return;
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = item;
    } else if (direction === 'backward') {
      if (idx === 0) return;
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = item;
    }

    updateState(copy);
  };

  // Property update helper
  const updateActiveProperty = (prop, val) => {
    if (!selectedId) return;
    const updated = elements.map(el => el.id === selectedId ? { ...el, [prop]: val } : el);
    updateState(updated);
  };

  const activeElement = elements.find(e => e.id === selectedId);

  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl relative z-10 w-full">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-150 dark:border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addPlaceholder(e.target.value);
            }}
            className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-dark-800 text-sm font-semibold text-dark-800 dark:text-white focus:outline-none"
          >
            <option value="">+ Add Placeholder Field</option>
            {PLACEHOLDERS.map(ph => (
              <option key={ph.id} value={ph.id}>{ph.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={addCustomText}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-bold border border-primary-500/20 transition-all"
          >
            <FiPlus /> Add Custom Text
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-secondary-500/10 hover:bg-secondary-500/20 text-secondary-600 dark:text-secondary-400 rounded-xl text-sm font-bold border border-secondary-500/20 cursor-pointer transition-all">
            <FiUploadCloud /> Logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => addImageElement(e, 'logo')} />
          </label>

          <label className="flex items-center gap-2 px-4 py-2 bg-accent-500/10 hover:bg-accent-500/20 text-accent-600 dark:text-accent-400 rounded-xl text-sm font-bold border border-accent-500/20 cursor-pointer transition-all">
            <FiUploadCloud /> Signature
            <input type="file" accept="image/*" className="hidden" onChange={(e) => addImageElement(e, 'signature')} />
          </label>

          <label className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-500/20 cursor-pointer transition-all">
            <FiUploadCloud /> Seal
            <input type="file" accept="image/*" className="hidden" onChange={(e) => addImageElement(e, 'seal')} />
          </label>
        </div>

        <div className="flex items-center gap-4">
          {/* Save Status indicator */}
          <span className={`text-xs font-bold ${saveStatus === 'saved' ? 'text-emerald-500' : 'text-amber-500'}`}>
            ● {saveStatus === 'saved' ? 'Autosaved' : 'Saving...'}
          </span>

          <div className="flex items-center gap-1 border-r border-gray-200 dark:border-white/5 pr-3">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className="p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-dark-800 text-dark-700 dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
              title="Undo (Ctrl+Z)"
            >
              <FiRotateCcw className="text-sm" />
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className="p-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-dark-800 text-dark-700 dark:text-white disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
              title="Redo (Ctrl+Y)"
            >
              <FiRotateCw className="text-sm" />
            </button>
          </div>

          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-dark-800 text-xs font-bold text-dark-700 dark:text-white focus:outline-none"
          >
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select>
        </div>
      </div>

      {/* 2. Layering & Styling Toolbar */}
      {activeElement && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-white/5 rounded-2xl">
          <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-white/10 pr-3">
            <span className="text-xs font-black uppercase text-dark-500 mr-2">Layering</span>
            <button type="button" onClick={() => moveLayer('to_front')} className="p-1.5 border rounded-lg bg-white hover:bg-gray-100" title="Bring to Front"><FiChevronsUp className="text-xs" /></button>
            <button type="button" onClick={() => moveLayer('forward')} className="p-1.5 border rounded-lg bg-white hover:bg-gray-100" title="Bring Forward"><FiChevronUp className="text-xs" /></button>
            <button type="button" onClick={() => moveLayer('backward')} className="p-1.5 border rounded-lg bg-white hover:bg-gray-100" title="Send Backward"><FiChevronDown className="text-xs" /></button>
            <button type="button" onClick={() => moveLayer('to_back')} className="p-1.5 border rounded-lg bg-white hover:bg-gray-100" title="Send to Back"><FiChevronsDown className="text-xs" /></button>
          </div>

          {(activeElement.type === 'placeholder' || activeElement.type === 'text') && (
            <>
              <select
                value={activeElement.font}
                onChange={(e) => updateActiveProperty('font', e.target.value)}
                className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-dark-700 text-xs font-semibold focus:outline-none"
              >
                {FONTS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-dark-500">Size</span>
                <input
                  type="number"
                  value={activeElement.fontSize}
                  min="8"
                  max="120"
                  onChange={(e) => updateActiveProperty('fontSize', Number(e.target.value))}
                  className="w-16 px-2 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-dark-700 text-xs font-semibold text-center focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 border-r border-gray-200 dark:border-white/10 pr-2">
                <button
                  type="button"
                  onClick={() => updateActiveProperty('bold', !activeElement.bold)}
                  className={`p-2 border rounded-lg text-xs font-bold transition-all ${
                    activeElement.bold 
                      ? 'bg-primary-500 border-primary-500 text-white' 
                      : 'bg-white dark:bg-dark-700 border-gray-200 dark:border-white/10 hover:bg-gray-100'
                  }`}
                >
                  <FiBold />
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveProperty('italic', !activeElement.italic)}
                  className={`p-2 border rounded-lg text-xs font-bold transition-all ${
                    activeElement.italic 
                      ? 'bg-primary-500 border-primary-500 text-white' 
                      : 'bg-white dark:bg-dark-700 border-gray-200 dark:border-white/10 hover:bg-gray-100'
                  }`}
                >
                  <FiItalic />
                </button>
              </div>

              <div className="flex items-center gap-1 border-r border-gray-200 dark:border-white/10 pr-2">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => updateActiveProperty('align', align)}
                    className={`p-2 border rounded-lg text-xs font-bold transition-all ${
                      activeElement.align === align
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white dark:bg-dark-700 border-gray-200 dark:border-white/10 hover:bg-gray-100'
                    }`}
                  >
                    {align === 'left' && <FiAlignLeft />}
                    {align === 'center' && <FiAlignRight />}
                    {align === 'right' && <FiAlignRight />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-dark-500">Color</span>
                <input
                  type="color"
                  value={activeElement.color}
                  onChange={(e) => updateActiveProperty('color', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 dark:border-white/10 bg-transparent p-0"
                />
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => duplicateElement(selectedId)}
              className="p-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 border border-primary-500/20 rounded-xl text-xs font-bold transition-all"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => removeElement(selectedId)}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
            >
              <FiTrash2 className="inline mr-1" /> Remove Element
            </button>
          </div>
        </div>
      )}

      {/* 3. Grid & Snap Options */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 dark:bg-dark-800/40 p-3.5 border border-gray-200/60 dark:border-white/5 rounded-2xl text-xs font-bold">
        <label className="flex items-center gap-2 cursor-pointer text-dark-700 dark:text-white">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => {
              setShowGrid(e.target.checked);
              triggerChangeAndSave(elements);
            }}
            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <FiGrid className="inline text-sm text-dark-500" /> Show Grid
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-dark-700 dark:text-white">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => {
              setSnapToGrid(e.target.checked);
              triggerChangeAndSave(elements);
            }}
            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          Snap to Grid
        </label>

        {snapToGrid && (
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-dark-700 text-xs font-semibold focus:outline-none"
          >
            <option value={5}>5 px</option>
            <option value={10}>10 px</option>
            <option value={20}>20 px</option>
          </select>
        )}

        {selectedId && (
          <span className="text-[10px] text-dark-500 ml-auto font-mono">
            ID: {activeElement?.id} | X: {Math.round(activeElement?.x)}px, Y: {Math.round(activeElement?.y)}px | W: {Math.round(activeElement?.w)}px, H: {Math.round(activeElement?.h)}px | Rotation: {activeElement?.rotation}°
          </span>
        )}
      </div>

      {/* 4. Canvas Viewport */}
      <div 
        className="w-full border border-gray-200 dark:border-white/10 rounded-2xl overflow-auto bg-dark-900/[0.04] dark:bg-white/[0.02] flex items-center justify-center p-12 relative"
        style={{ minHeight: '600px' }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div
            ref={canvasRef}
            className="relative shadow-2xl bg-white select-none border border-gray-350 overflow-hidden"
            style={{
              width: `${V_WIDTH}px`,
              height: `${V_HEIGHT}px`,
              backgroundImage: templateUrl ? `url(${templateUrl})` : 'none',
              backgroundSize: '100% 100%'
            }}
            onClick={() => setSelectedId(null)}
          >
            {/* Grid overlay */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(156, 163, 175, 0.18) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(156, 163, 175, 0.18) 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridSize}px ${gridSize}px`
                }}
              />
            )}

            {/* Elements */}
            {elements.map((el) => {
              const isSelected = el.id === selectedId;

              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.w}px`,
                    height: `${el.h}px`,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    border: isSelected ? '2px solid #3B82F6' : '1.5px transparent dashed',
                    boxShadow: isSelected ? '0 0 0 1px rgba(255,255,255,0.8), 0 4px 10px rgba(0,0,0,0.15)' : 'none',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                    cursor: 'move',
                    zIndex: isSelected ? 100 : elements.indexOf(el) + 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: el.align === 'center' ? 'center' : (el.align === 'right' ? 'flex-end' : 'flex-start')
                  }}
                  onMouseDown={(e) => handleDragStart(e, el)}
                >
                  {/* Rotation indicator & handle */}
                  {isSelected && (
                    <div 
                      className="absolute left-1/2 -top-8 w-6 h-6 bg-white border-2 border-primary-500 rounded-full flex items-center justify-center cursor-pointer shadow-md transform -translate-x-1/2"
                      onMouseDown={(e) => handleRotateStart(e, el)}
                      title="Drag to rotate"
                    >
                      <FiRotateCw className="text-[10px] text-primary-500" />
                    </div>
                  )}

                  {/* Corner resizing handles */}
                  {isSelected && (
                    <>
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-nw-resize" onMouseDown={(e) => handleResizeStart(e, el, 'nw')} />
                      <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-ne-resize" onMouseDown={(e) => handleResizeStart(e, el, 'ne')} />
                      <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, el, 'sw')} />
                      <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-full cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, el, 'se')} />
                    </>
                  )}

                  {/* Rendering element values */}
                  {el.type === 'placeholder' && (
                    <div
                      style={{
                        fontFamily: el.font,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: el.bold ? 'bold' : 'normal',
                        fontStyle: el.italic ? 'italic' : 'normal',
                        color: el.color,
                        textAlign: el.align,
                        letterSpacing: `${el.letterSpacing}px`,
                        lineHeight: el.lineHeight,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                        width: '100%'
                      }}
                    >
                      {el.name}
                    </div>
                  )}

                  {el.type === 'text' && (
                    <input
                      type="text"
                      value={el.text}
                      onChange={(e) => {
                        const updated = elements.map(item => item.id === el.id ? { ...item, text: e.target.value } : item);
                        updateState(updated);
                      }}
                      style={{
                        fontFamily: el.font,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: el.bold ? 'bold' : 'normal',
                        fontStyle: el.italic ? 'italic' : 'normal',
                        color: el.color,
                        textAlign: el.align,
                        letterSpacing: `${el.letterSpacing}px`,
                        lineHeight: el.lineHeight,
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        padding: '0 4px',
                        margin: 0
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {el.type === 'image' && (
                    <img
                      src={el.url}
                      alt={el.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
