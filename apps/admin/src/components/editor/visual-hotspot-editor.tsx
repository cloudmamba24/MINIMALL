"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Move, 
  Tag,
  Save,
  Undo,
  Redo,
  Search,
  X,
  Check,
  Settings
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import type { ProductTag, ShoppableTile } from "@minimall/core/types/tiles";
import type { ShopifyProduct } from "@minimall/core/types";

interface VisualHotspotEditorProps {
  tile: ShoppableTile;
  products: ShopifyProduct[];
  onSave: (updatedTile: ShoppableTile) => Promise<void>;
  onCancel: () => void;
}

interface DraggingHotspot {
  id: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function VisualHotspotEditor({
  tile,
  products,
  onSave,
  onCancel
}: VisualHotspotEditorProps) {
  const [hotspots, setHotspots] = useState<ProductTag[]>(tile.products || []);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingHotspot, setDraggingHotspot] = useState<DraggingHotspot | null>(null);
  const [hotspotStyle, setHotspotStyle] = useState(tile.hotspotStyle || "dot-text");
  const [history, setHistory] = useState<ProductTag[][]>([tile.products || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const imageRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Calculate image dimensions
  useEffect(() => {
    if (imageRef.current) {
      const updateDimensions = () => {
        const rect = imageRef.current!.getBoundingClientRect();
        setImageDimensions({ width: rect.width, height: rect.height });
      };
      
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      
      // Initial dimension calculation after image load
      const img = imageRef.current.querySelector("img");
      if (img?.complete) {
        updateDimensions();
      } else {
        img?.addEventListener("load", updateDimensions);
      }
      
      return () => {
        window.removeEventListener("resize", updateDimensions);
      };
    }
  }, []);

  // Filter products for search
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add to history for undo/redo
  const addToHistory = useCallback((newHotspots: ProductTag[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newHotspots]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setHotspots(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setHotspots(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Handle clicking on image to add hotspot
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHotspot || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newHotspot: ProductTag = {
      id: `hotspot-${Date.now()}`,
      productId: "",
      position: { x, y },
      visible: true,
      pulseAnimation: true,
      clickAction: "quickview"
    };
    
    const newHotspots = [...hotspots, newHotspot];
    setHotspots(newHotspots);
    addToHistory(newHotspots);
    setSelectedHotspot(newHotspot.id);
    setShowProductSearch(true);
    setIsAddingHotspot(false);
  }, [isAddingHotspot, hotspots, addToHistory]);

  // Handle dragging hotspots
  const handleHotspotMouseDown = useCallback((e: React.MouseEvent, hotspotId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const hotspot = hotspots.find(h => h.id === hotspotId);
    if (!hotspot || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    setDraggingHotspot({
      id: hotspotId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: (hotspot.position.x / 100) * rect.width,
      currentY: (hotspot.position.y / 100) * rect.height
    });
    
    setSelectedHotspot(hotspotId);
  }, [hotspots]);

  // Handle mouse move for dragging
  useEffect(() => {
    if (!draggingHotspot || !imageRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = imageRef.current!.getBoundingClientRect();
      const deltaX = e.clientX - draggingHotspot.startX;
      const deltaY = e.clientY - draggingHotspot.startY;
      
      const newX = Math.max(0, Math.min(100, ((draggingHotspot.currentX + deltaX) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, ((draggingHotspot.currentY + deltaY) / rect.height) * 100));
      
      setHotspots(prev => prev.map(h => 
        h.id === draggingHotspot.id 
          ? { ...h, position: { x: newX, y: newY } }
          : h
      ));
    };
    
    const handleMouseUp = () => {
      if (draggingHotspot) {
        addToHistory(hotspots);
      }
      setDraggingHotspot(null);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingHotspot, hotspots, addToHistory]);

  // Delete hotspot
  const handleDeleteHotspot = useCallback((hotspotId: string) => {
    const newHotspots = hotspots.filter(h => h.id !== hotspotId);
    setHotspots(newHotspots);
    addToHistory(newHotspots);
    setSelectedHotspot(null);
  }, [hotspots, addToHistory]);

  // Toggle hotspot visibility
  const handleToggleVisibility = useCallback((hotspotId: string) => {
    const newHotspots = hotspots.map(h => 
      h.id === hotspotId ? { ...h, visible: !h.visible } : h
    );
    setHotspots(newHotspots);
    addToHistory(newHotspots);
  }, [hotspots, addToHistory]);

  // Assign product to hotspot
  const handleAssignProduct = useCallback((hotspotId: string, product: ShopifyProduct) => {
    const newHotspots = hotspots.map(h => 
      h.id === hotspotId 
        ? { 
            ...h, 
            productId: product.id,
            label: product.title,
            price: product.priceRange.minVariantPrice.amount 
          }
        : h
    );
    setHotspots(newHotspots);
    addToHistory(newHotspots);
    setShowProductSearch(false);
    setSearchQuery("");
  }, [hotspots, addToHistory]);

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedTile: ShoppableTile = {
        ...tile,
        products: hotspots,
        hotspotStyle,
        hotspotsVisible: hotspots.some(h => h.visible)
      };
      await onSave(updatedTile);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedHotspot) {
              e.preventDefault();
              handleDeleteHotspot(selectedHotspot);
            }
            break;
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHotspot, handleUndo, handleRedo, handleDeleteHotspot]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingHotspot(!isAddingHotspot)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isAddingHotspot 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Hotspot
            </button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <select
              value={hotspotStyle}
              onChange={(e) => setHotspotStyle(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="dot">Dot Only</option>
              <option value="dot-text">Dot + Text</option>
              <option value="numbered">Numbered</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}
            </span>
            
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Image Canvas */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div 
            ref={imageRef}
            className={`relative max-w-full max-h-full ${
              isAddingHotspot ? "cursor-crosshair" : "cursor-default"
            }`}
            onClick={handleImageClick}
          >
            <Image
              src={tile.media.url}
              alt="Product image"
              width={tile.media.width}
              height={tile.media.height}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
            
            {/* Render Hotspots */}
            <AnimatePresence>
              {hotspots.map((hotspot, index) => (
                <motion.div
                  key={hotspot.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                    selectedHotspot === hotspot.id ? "z-20" : "z-10"
                  }`}
                  style={{
                    left: `${hotspot.position.x}%`,
                    top: `${hotspot.position.y}%`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onMouseDown={(e) => handleHotspotMouseDown(e, hotspot.id)}
                >
                  {/* Hotspot Visual */}
                  <div className={`
                    relative
                    ${draggingHotspot?.id === hotspot.id ? "cursor-grabbing" : "cursor-grab"}
                    ${hotspot.pulseAnimation && hotspot.visible ? "animate-pulse" : ""}
                  `}>
                    {/* Main Hotspot */}
                    <div className={`
                      ${hotspotStyle === "numbered" 
                        ? "w-8 h-8 bg-white text-black font-semibold text-sm shadow-lg" 
                        : "w-4 h-4 bg-white shadow-lg"}
                      rounded-full flex items-center justify-center
                      ${!hotspot.visible ? "opacity-50" : ""}
                      ${selectedHotspot === hotspot.id ? "ring-2 ring-purple-500 ring-offset-2" : ""}
                    `}>
                      {hotspotStyle === "numbered" && (index + 1)}
                    </div>
                    
                    {/* Label for dot-text style */}
                    {hotspotStyle === "dot-text" && hotspot.label && hotspot.visible && (
                      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                        {hotspot.label}
                        {hotspot.price && <span className="ml-1 font-semibold">${hotspot.price}</span>}
                      </div>
                    )}
                    
                    {/* Selected Hotspot Controls */}
                    {selectedHotspot === hotspot.id && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg p-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(hotspot.id);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title={hotspot.visible ? "Hide" : "Show"}
                        >
                          {hotspot.visible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProductSearch(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Change Product"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHotspot(hotspot.id);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add Hotspot Indicator */}
            {isAddingHotspot && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                  Click anywhere to add a hotspot
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Hotspot List */}
      <div className="w-80 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Hotspots</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {hotspots.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No hotspots yet</p>
              <p className="text-xs mt-1">Click "Add Hotspot" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hotspots.map((hotspot, index) => {
                const product = products.find(p => p.id === hotspot.productId);
                
                return (
                  <div
                    key={hotspot.id}
                    onClick={() => setSelectedHotspot(hotspot.id)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedHotspot === hotspot.id 
                        ? "border-purple-500 bg-purple-50" 
                        : "border-gray-200 hover:bg-gray-50"}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`
                          ${hotspotStyle === "numbered" 
                            ? "w-6 h-6 bg-purple-600 text-white text-xs" 
                            : "w-3 h-3 bg-purple-600 mt-1.5"}
                          rounded-full flex items-center justify-center flex-shrink-0
                        `}>
                          {hotspotStyle === "numbered" && (index + 1)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {product ? (
                            <>
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {product.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                ${product.priceRange.minVariantPrice.amount}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No product assigned
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-1">
                            Position: {Math.round(hotspot.position.x)}%, {Math.round(hotspot.position.y)}%
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(hotspot.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {hotspot.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Product Search Modal */}
      <AnimatePresence>
        {showProductSearch && selectedHotspot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowProductSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Select Product</h3>
                  <button
                    onClick={() => setShowProductSearch(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAssignProduct(selectedHotspot, product)}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      {product.images[0] && (
                        <Image
                          src={product.images[0].url}
                          alt={product.title}
                          width={60}
                          height={60}
                          className="rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 line-clamp-2">
                          {product.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          ${product.priceRange.minVariantPrice.amount}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No products found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}