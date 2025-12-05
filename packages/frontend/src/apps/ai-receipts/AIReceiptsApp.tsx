import React, { useEffect, useState, useRef } from 'react';
import { getReceipts, uploadReceipt, deleteReceipt, cropEnhanceReceiptImage, downloadReceiptImage, setDisplayImageVersion, updateReceipt, type ReceiptData, type ImageProcessingOptions } from '../../services/receiptService';
import './AIReceiptsApp.css';

type EditingReceipt = ReceiptData & { isEditing?: boolean };

export const AIReceiptsApp: React.FC = () => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<EditingReceipt | null>(null);
  const [editingFormData, setEditingFormData] = useState<Partial<ReceiptData> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false); // New state for image optimization
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredReceipts(receipts);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = receipts.filter(r => 
        r.storeName?.toLowerCase().includes(term) ||
        r.items.some(item => item.name.toLowerCase().includes(term)) ||
        r.category?.toLowerCase().includes(term)
      );
      setFilteredReceipts(filtered);
    }
  }, [searchTerm, receipts]);

  const loadReceipts = async () => {
    try {
      const data = await getReceipts();
      // Explicitly sort receipts by date (newest first) on the client-side
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt).getTime();
        const dateB = new Date(b.date || b.createdAt).getTime();
        return dateB - dateA;
      });
      setReceipts(sortedData);
    } catch (error) {
      console.error('Failed to load receipts', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newReceipt = await uploadReceipt(file);
      setReceipts(prev => [newReceipt, ...prev]);
      setSelectedReceipt(newReceipt);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to process receipt. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return;

    try {
      await deleteReceipt(id);
      setReceipts(prev => prev.filter(r => r.id !== id));
      
      if (selectedReceipt?.id === id) setSelectedReceipt(null);
      if (editingReceipt?.id === id) setEditingReceipt(null);

    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete receipt.');
    }
  };

  const handleOptimizeImage = async () => {
    if (!editingReceipt) return;
    setIsOptimizingImage(true);

    // Define default image processing options for "Crop & Enhance"
    // These options can be exposed to the UI later for user configuration.
    const options: ImageProcessingOptions = {
      resize: { width: 1024, height: 1024, fit: 'inside' },
      format: { type: 'jpeg', options: { quality: 80 } },
      // Other options can be added here if exposed in UI, e.g., grayscale: true, sharpen: true, crop: { ... }
    };

    try {
      // Call the renamed service function with options
      const response = await cropEnhanceReceiptImage(editingReceipt.id, options);
      alert('Image crop-enhanced successfully!');
      // Update the editingReceipt state with the new optimized image URL
      setEditingReceipt(prev => prev ? {
        ...prev,
        optimizedImageUrl: response.displayImageUrl, // Backend returns displayImageUrl as the new optimized one
        displayImageUrl: response.displayImageUrl,
      } : null);
      await loadReceipts(); // Refresh receipts to reflect potential image changes
    } catch (error) {
      console.error('Image crop-enhancement failed:', error);
      alert('Failed to crop and enhance image. Please try again.');
    } finally {
      setIsOptimizingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (!editingReceipt) return;
    // Download the currently displayed image version
    downloadReceiptImage(editingReceipt.id);
  };

  const handleSetDisplayImageVersion = async (version: 'original' | 'optimized') => {
    if (!editingReceipt) return;
    try {
      const response = await setDisplayImageVersion(editingReceipt.id, version);
      // Update the editingReceipt state with the new display image URL
      setEditingReceipt(prev => prev ? {
        ...prev,
        displayImageUrl: response.displayImageUrl,
      } : null);
      await loadReceipts(); // Refresh to update card view
    } catch (error) {
      console.error('Failed to set display image version:', error);
      alert('Failed to switch image version.');
    }
  };

  const handleEditDetailsClick = () => {
    if (!editingReceipt) return;
    setEditingFormData(editingReceipt);
    setEditingReceipt({ ...editingReceipt, isEditing: true });
  };

  const handleCancelEdit = () => {
    if (!editingReceipt) return;
    setEditingReceipt({ ...editingReceipt, isEditing: false });
    setEditingFormData(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingFormData) return;
    const { name, value, type } = e.target;
    
    // Handle number inputs
    const newValue = type === 'number' ? parseFloat(value) : value;

    setEditingFormData({
      ...editingFormData,
      [name]: newValue,
    });
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingFormData || !editingFormData.items) return;
    const { name, value, type } = e.target;
    const newItems = [...editingFormData.items];
    const itemToUpdate = { ...newItems[index] };
    
    if (name === 'name') {
      itemToUpdate.name = value;
    } else if (name === 'price') {
      itemToUpdate.price = parseFloat(value) || 0;
    }

    newItems[index] = itemToUpdate;
    setEditingFormData({ ...editingFormData, items: newItems });
  };

  const handleAddItem = () => {
    if (!editingFormData) return;
    const newItems = [...(editingFormData.items || [])];
    newItems.push({ name: '', price: 0 });
    setEditingFormData({ ...editingFormData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (!editingFormData || !editingFormData.items) return;
    const newItems = [...editingFormData.items];
    newItems.splice(index, 1);
    setEditingFormData({ ...editingFormData, items: newItems });
  };

  const handleSave = async () => {
    if (!editingFormData || !editingReceipt) return;

    try {
      const updatedReceipt = await updateReceipt(editingReceipt.id, editingFormData);
      
      // Update local state
      setReceipts(prev => prev.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
      
      // Exit editing mode
      setEditingReceipt(updatedReceipt);
      setEditingFormData(null);
      alert('Receipt updated successfully!');

    } catch (error) {
      console.error('Failed to update receipt', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setEditingReceipt(null);
    setEditingFormData(null);
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return 'N/A';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount);
    } catch {
      return `${amount} ${currency || ''}`;
    }
  };

  // Native Grouping Logic
  const getGroupKey = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown Date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown Date';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    if (viewMode === 'day') return `${yyyy}-${mm}-${dd}`;
    if (viewMode === 'month') return `${yyyy}-${mm}`;
    if (viewMode === 'year') return `${yyyy}`;
    return 'Unknown Date';
  };

  const groupedReceipts: Record<string, ReceiptData[]> = {};
  filteredReceipts.forEach(r => {
    const key = getGroupKey(r.date || r.createdAt);
    if (!groupedReceipts[key]) groupedReceipts[key] = [];
    groupedReceipts[key].push(r);
  });

  // Sort keys descending (newest first)
  const sortedGroupKeys = Object.keys(groupedReceipts).sort().reverse();

  return (
    <div className="receipt-app-container">
      <div className="receipt-header">
        <div className="header-top">
            <h2>My Receipts</h2>
            <button 
            className="scan-btn" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            >
            {isUploading ? 'Processing...' : '📷 Scan Receipt'}
            </button>
        </div>
        
        <div className="header-controls">
            <div className="view-toggles">
                <button 
                    className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`}
                    onClick={() => setViewMode('day')}
                >Day</button>
                <button 
                    className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                    onClick={() => setViewMode('month')}
                >Month</button>
                <button 
                    className={`toggle-btn ${viewMode === 'year' ? 'active' : ''}`}
                    onClick={() => setViewMode('year')}
                >Year</button>
            </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
        />
      </div>

      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search stores, items, or categories..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="receipt-list-container">
        {filteredReceipts.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
            {receipts.length === 0 ? "No receipts yet. Scan one!" : "No matches found."}
          </p>
        ) : (
          sortedGroupKeys.map(groupKey => (
            <div key={groupKey} className="receipt-group">
                <h3 className="group-header">{groupKey}</h3>
                <div className="receipt-list">
                    {groupedReceipts[groupKey].map(receipt => (
                        <div 
                        key={receipt.id} 
                        className="receipt-card"
                        onClick={() => setSelectedReceipt(receipt)}
                        >
                        <div className="card-thumbnail-container">
                            <img 
                                src={receipt.displayImageUrl} 
                                alt="Thumbnail" 
                                className="card-thumbnail"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'; // Generic image icon
                                    (e.target as HTMLImageElement).style.backgroundColor = '#f0f0f0';
                                }} 
                            />
                        </div>
                        <div className="card-content">
                            <div className="card-header">
                                <span className="store-name">{receipt.storeName || 'Unknown Store'}</span>
                                <div className="card-header-right">
                                    <span className="receipt-date">{receipt.date}</span>
                                    <button 
                                        className="icon-btn edit-btn-small"
                                        title="Edit"
                                        onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingReceipt(receipt);
                                        }}
                                    >
                                        ✏️
                                    </button>
                                </div>
                            </div>
                            <div className="card-amount">
                                {formatCurrency(receipt.totalAmount, receipt.currency)}
                            </div>
                            {receipt.category && (
                                <span className="card-category">{receipt.category}</span>
                            )}
                        </div>
                        </div>
                    ))}
                </div>
            </div>
          ))
        )}
      </div>

      {/* Manage/Edit Modal */}
      {editingReceipt && (
        <div className="receipt-detail-overlay" onClick={handleCloseModal}>
           <div className="receipt-manage-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingReceipt.isEditing ? 'Edit Details' : 'Manage Receipt'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>&times;</button>
              </div>
              <div className="modal-body">
                {editingReceipt.isEditing ? (
                  <>
                    <div className="info-group form-group">
                      <label htmlFor="storeName">Store Name</label>
                      <input type="text" id="storeName" name="storeName" value={editingFormData?.storeName || ''} onChange={handleFormChange} />
                    </div>
                    <div className="info-group form-group">
                      <label htmlFor="date">Date</label>
                      <input type="date" id="date" name="date" value={editingFormData?.date || ''} onChange={handleFormChange} />
                    </div>
                    <div className="info-group form-group">
                      <label htmlFor="totalAmount">Total Amount</label>
                      <input type="number" id="totalAmount" name="totalAmount" value={editingFormData?.totalAmount || 0} onChange={handleFormChange} />
                    </div>

                    <div className="info-group form-group">
                        <label>Items</label>
                        <div className="item-edit-list">
                            {editingFormData?.items?.map((item, index) => (
                                <div key={index} className="item-edit-row">
                                    <input 
                                        type="text" 
                                        name="name" 
                                        placeholder="Item name"
                                        value={item.name} 
                                        onChange={(e) => handleItemChange(index, e)} 
                                    />
                                    <input 
                                        type="number" 
                                        name="price" 
                                        placeholder="Price"
                                        value={item.price || ''} 
                                        onChange={(e) => handleItemChange(index, e)} 
                                    />
                                    <button className="remove-item-btn" onClick={() => handleRemoveItem(index)}>&times;</button>
                                </div>
                            ))}
                        </div>
                        <button className="add-item-btn" onClick={handleAddItem}>+ Add Item</button>
                    </div>

                    <div className="manage-actions">
                      <button className="action-btn edit-btn-large" onClick={handleSave}>Save Changes</button>
                      <button className="action-btn" onClick={handleCancelEdit}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Display current image */}
                    <div className="receipt-image-preview-container">
                        <img 
                            src={editingReceipt.displayImageUrl}
                            alt="Receipt Preview"
                            className="modal-receipt-image"
                            onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'; // Generic image icon
                                (e.target as HTMLImageElement).style.backgroundColor = '#f0f0f0';
                            }} 
                        />
                    </div>
                    <div className="image-version-toggle">
                        <label>
                            <input 
                                type="radio" 
                                name="imageVersion" 
                                value="original"
                                checked={editingReceipt.displayImageUrl === editingReceipt.originalImageUrl}
                                onChange={() => handleSetDisplayImageVersion('original')}
                            /> Original
                        </label>
                        {editingReceipt.optimizedImageUrl && (
                            <label>
                                <input 
                                    type="radio" 
                                    name="imageVersion" 
                                    value="optimized"
                                    checked={editingReceipt.displayImageUrl === editingReceipt.optimizedImageUrl}
                                    onChange={() => handleSetDisplayImageVersion('optimized')}
                                /> Optimized
                            </label>
                        )}
                    </div>

                    <div className="modal-info-compact">
                        <p><strong>Store:</strong> {editingReceipt.storeName}</p>
                        <p><strong>Amount:</strong> {formatCurrency(editingReceipt.totalAmount, editingReceipt.currency)}</p>
                    </div>
                    
                    <div className="manage-actions">
                        <button 
                            className="action-btn"
                            onClick={handleOptimizeImage}
                            disabled={isOptimizingImage}
                        >
                            {isOptimizingImage ? 'Optimizing...' : '✨ Crop & Enhance'}
                        </button>
                        <button 
                            className="action-btn coming-soon-btn"
                            disabled
                        >
                            Canify Enhance (Coming Soon)
                        </button>
                        <button className="action-btn" onClick={handleEditDetailsClick}>Edit Details</button>
                        
                        <div className="sub-actions">
                            <button 
                                className="action-btn"
                                onClick={handleDownloadImage}
                            >
                                ⬇️ Download
                            </button>
                            <button 
                                className="action-btn delete-btn-large"
                                onClick={() => handleDeleteReceipt(editingReceipt.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                  </>
                )}
              </div>
           </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="receipt-detail-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Receipt Details</h3>
              <button className="close-btn" onClick={() => setSelectedReceipt(null)}>&times;</button>
            </div>
            <div className="modal-content">
              <div className="receipt-image-container">
                <img 
                  src={selectedReceipt.displayImageUrl} // Use displayImageUrl here
                  alt="Receipt" 
                  className="receipt-image" 
                  onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'; // Generic image icon
                      (e.target as HTMLImageElement).style.backgroundColor = '#f0f0f0';
                  }} 
                />
              </div>
              <div className="receipt-info">
                <div className="info-group">
                  <div className="info-label">Store</div>
                  <div className="info-value"><strong>{selectedReceipt.storeName}</strong></div>
                </div>
                
                <div className="info-group">
                  <div className="info-label">Date</div>
                  <div className="info-value">{selectedReceipt.date}</div>
                </div>

                <div className="info-group">
                  <div className="info-label">Total</div>
                  <div className="amount-large">
                    {formatCurrency(selectedReceipt.totalAmount, selectedReceipt.currency)}
                  </div>
                </div>

                <div className="info-group">
                  <div className="info-label">Category</div>
                  <div className="info-value">{selectedReceipt.category || 'Uncategorized'}</div>
                </div>

                <div className="info-group">
                  <div className="info-label">Items ({selectedReceipt.items.length})</div>
                  {selectedReceipt.items.length > 0 ? (
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="price-col">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReceipt.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}
                              {item.name}
                            </td>
                            <td className="price-col">
                              {item.price !== null ? item.price.toFixed(2) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#888', fontSize: '0.9em' }}>No items extracted.</p>
                  )}
                </div>

                <div className="info-group" style={{marginTop: '20px', textAlign: 'center'}}>
                    <button 
                        className="action-btn edit-btn-large"
                        onClick={() => {
                            setSelectedReceipt(null);
                            setEditingReceipt(selectedReceipt);
                        }}
                    >
                        Manage / Edit
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};