"use client";

import { AnimatePresence, motion, Reorder } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Grid,
  List,
  Filter,
  Search,
  ChevronRight,
  Package,
  Tag,
  Calendar,
  TrendingUp,
  Eye,
  EyeOff,
  Copy,
  MoreVertical,
  Folder,
  FolderOpen,
  Hash,
  DollarSign,
  Save,
  X
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
// TODO: Import from @minimall/core once types are properly exported
type Tile = any;
type TileCollection = any;
type ShopifyProduct = any;

interface CollectionManagerProps {
  collections: TileCollection[];
  tiles: Tile[];
  products: ShopifyProduct[];
  onSave: (collections: TileCollection[]) => Promise<void>;
}

type FilterRule = {
  id: string;
  field: "productType" | "vendor" | "tag" | "price" | "title";
  operator: "equals" | "contains" | "greater" | "less" | "between";
  value: string | number | [number, number];
};

type CollectionType = "manual" | "smart";

interface EditingCollection extends TileCollection {
  type: CollectionType;
  rules?: FilterRule[];
}

export function CollectionManager({
  collections: initialCollections,
  tiles,
  products,
  onSave
}: CollectionManagerProps) {
  const [collections, setCollections] = useState<TileCollection[]>(initialCollections);
  const [editingCollection, setEditingCollection] = useState<EditingCollection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    return collections.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collections, searchQuery]);

  // Get tiles for a collection
  const getCollectionTiles = useCallback((collection: TileCollection): Tile[] => {
    return collection.tiles
      .map((tileId: any) => tiles.find((t: any) => t.id === tileId))
      .filter(Boolean) as Tile[];
  }, [tiles]);

  // Create new collection
  const handleCreateCollection = useCallback(() => {
    const newCollection: EditingCollection = {
      id: `collection-${Date.now()}`,
      name: "New Collection",
      description: "",
      tiles: [],
      type: "manual",
      layout: {
        type: "grid",
        columns: { mobile: 2, tablet: 3, desktop: 4 },
        gap: { mobile: 8, tablet: 12, desktop: 16 },
        density: "regular"
      },
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setEditingCollection(newCollection);
    setShowCreateModal(true);
  }, []);

  // Edit existing collection
  const handleEditCollection = useCallback((collection: TileCollection) => {
    setEditingCollection({
      ...collection,
      type: "manual" // Default to manual, would need to detect smart collections
    });
    setShowCreateModal(true);
  }, []);

  // Delete collection
  const handleDeleteCollection = useCallback((collectionId: string) => {
    if (confirm("Are you sure you want to delete this collection?")) {
      setCollections(prev => prev.filter(c => c.id !== collectionId));
    }
  }, []);

  // Duplicate collection
  const handleDuplicateCollection = useCallback((collection: TileCollection) => {
    const duplicate: TileCollection = {
      ...collection,
      id: `collection-${Date.now()}`,
      name: `${collection.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCollections(prev => [...prev, duplicate]);
  }, []);

  // Toggle collection visibility
  const handleToggleVisibility = useCallback((collectionId: string) => {
    setCollections(prev => prev.map(c => 
      c.id === collectionId ? { ...c, visible: !c.visible } : c
    ));
  }, []);

  // Save collection changes
  const handleSaveCollection = useCallback(async () => {
    if (!editingCollection) return;

    setIsSaving(true);
    try {
      const existingIndex = collections.findIndex(c => c.id === editingCollection.id);
      
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...collections];
        updated[existingIndex] = {
          ...editingCollection,
          updatedAt: new Date()
        };
        setCollections(updated);
      } else {
        // Add new
        setCollections(prev => [...prev, editingCollection]);
      }
      
      setShowCreateModal(false);
      setEditingCollection(null);
    } finally {
      setIsSaving(false);
    }
  }, [editingCollection, collections]);

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(collections);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
              <p className="text-sm text-gray-500 mt-1">
                Organize your content into collections
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateCollection}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Collection
              </button>
              
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save All
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <button className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Collections Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCollections.map((collection) => {
                const collectionTiles = getCollectionTiles(collection);
                
                return (
                  <motion.div
                    key={collection.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {collection.visible ? (
                            <FolderOpen className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Folder className="w-5 h-5 text-gray-400" />
                          )}
                          <h3 className="font-semibold text-gray-900">
                            {collection.name}
                          </h3>
                        </div>
                        
                        <div className="relative group">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => handleEditCollection(collection)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDuplicateCollection(collection)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleToggleVisibility(collection.id)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              {collection.visible ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  Show
                                </>
                              )}
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDeleteCollection(collection.id)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {collection.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {collectionTiles.length} items
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(collection.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Preview Grid */}
                      {collectionTiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-1 mt-3">
                          {collectionTiles.slice(0, 6).map((tile) => (
                            <div
                              key={tile.id}
                              className="aspect-square bg-gray-100 rounded overflow-hidden"
                            >
                              {tile.type !== "navigation" && tile.media?.thumbnailUrl && (
                                <img
                                  src={tile.media.thumbnailUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {tile.type === "navigation" && (
                                <div
                                  className="w-full h-full flex items-center justify-center text-xs font-medium text-white"
                                  style={{
                                    background: tile.background.type === "color" 
                                      ? tile.background.value 
                                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                  }}
                                >
                                  {tile.text.primary.slice(0, 2)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Collection
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCollections.map((collection) => {
                    const collectionTiles = getCollectionTiles(collection);
                    
                    return (
                      <tr key={collection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {collection.visible ? (
                              <FolderOpen className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Folder className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {collection.name}
                              </p>
                              {collection.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {collection.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {collectionTiles.length}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`
                            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${collection.visible 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"}
                          `}>
                            {collection.visible ? "Visible" : "Hidden"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(collection.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCollection(collection)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleToggleVisibility(collection.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {collection.visible ? (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteCollection(collection.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Collection Editor Modal */}
      <AnimatePresence>
        {showCreateModal && editingCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCollection.id.startsWith("collection-") ? "Create" : "Edit"} Collection
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={editingCollection.name}
                      onChange={(e) => setEditingCollection({
                        ...editingCollection,
                        name: e.target.value
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingCollection.description || ""}
                      onChange={(e) => setEditingCollection({
                        ...editingCollection,
                        description: e.target.value
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Collection Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collection Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setEditingCollection({
                          ...editingCollection,
                          type: "manual"
                        })}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          editingCollection.type === "manual"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Grid className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Manual</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Hand-pick tiles for this collection
                        </p>
                      </button>

                      <button
                        onClick={() => setEditingCollection({
                          ...editingCollection,
                          type: "smart",
                          rules: editingCollection.rules || []
                        })}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          editingCollection.type === "smart"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Filter className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Smart</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Automatically add tiles based on rules
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Manual Selection */}
                  {editingCollection.type === "manual" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Tiles
                      </label>
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {tiles.map((tile) => (
                            <label
                              key={tile.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={editingCollection.tiles.includes(tile.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditingCollection({
                                      ...editingCollection,
                                      tiles: [...editingCollection.tiles, tile.id]
                                    });
                                  } else {
                                    setEditingCollection({
                                      ...editingCollection,
                                      tiles: editingCollection.tiles.filter((id: any) => id !== tile.id)
                                    });
                                  }
                                }}
                                className="rounded text-purple-600"
                              />
                              <span className="text-sm truncate">
                                {tile.type === "navigation" 
                                  ? tile.text.primary 
                                  : tile.caption || `${tile.type} tile`}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Smart Rules */}
                  {editingCollection.type === "smart" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter Rules
                      </label>
                      <div className="space-y-2">
                        {editingCollection.rules?.map((rule) => (
                          <div key={rule.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <select className="px-2 py-1 border rounded text-sm">
                              <option value="productType">Product Type</option>
                              <option value="vendor">Vendor</option>
                              <option value="tag">Tag</option>
                              <option value="price">Price</option>
                            </select>
                            <select className="px-2 py-1 border rounded text-sm">
                              <option value="equals">Equals</option>
                              <option value="contains">Contains</option>
                              <option value="greater">Greater than</option>
                              <option value="less">Less than</option>
                            </select>
                            <input
                              type="text"
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              placeholder="Value"
                            />
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600">
                          + Add Rule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCollection}
                  disabled={isSaving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Collection"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}