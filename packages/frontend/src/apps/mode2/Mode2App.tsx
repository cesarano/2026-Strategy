import React, { useEffect, useState, useRef } from 'react';
import { getReceipts, uploadReceipt, deleteReceipt, type ReceiptData } from '../../services/receiptService';
import './Mode2App.css';

export const Mode2App: React.FC = () => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      setReceipts(data);
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

  return (
    <div className="receipt-app-container">
      <div className="receipt-header">
        <h2>My Receipts</h2>
        <button 
          className="scan-btn" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Processing...' : '📷 Scan Receipt'}
        </button>
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

      <div className="receipt-list">
        {filteredReceipts.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', gridColumn: '1/-1' }}>
            {receipts.length === 0 ? "No receipts yet. Scan one!" : "No matches found."}
          </p>
        ) : (
          filteredReceipts.map(receipt => (
            <div 
              key={receipt.id} 
              className="receipt-card"
              onClick={() => setSelectedReceipt(receipt)}
            >
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
          ))
        )}
      </div>

      {/* Manage/Edit Modal */}
      {editingReceipt && (
        <div className="receipt-detail-overlay" onClick={() => setEditingReceipt(null)}>
           <div className="receipt-manage-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Manage Receipt</h3>
                <button className="close-btn" onClick={() => setEditingReceipt(null)}>&times;</button>
              </div>
              <div className="modal-body">
                 <p><strong>Store:</strong> {editingReceipt.storeName}</p>
                 <p><strong>Amount:</strong> {formatCurrency(editingReceipt.totalAmount, editingReceipt.currency)}</p>
                 
                 <div className="manage-actions">
                    <button className="action-btn coming-soon-btn" disabled>Edit Details (Coming Soon)</button>
                    <button 
                        className="action-btn delete-btn-large"
                        onClick={() => handleDeleteReceipt(editingReceipt.id)}
                    >
                        Delete Receipt
                    </button>
                 </div>
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
                  src={selectedReceipt.imageUrl} 
                  alt="Receipt" 
                  className="receipt-image" 
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
