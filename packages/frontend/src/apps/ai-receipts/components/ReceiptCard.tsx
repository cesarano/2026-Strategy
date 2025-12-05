import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { ReceiptData } from '../../../services/receiptService';
import './ReceiptCard.css';

interface ReceiptCardProps {
  receipt: ReceiptData;
  onClick: (receipt: ReceiptData) => void;
  onDelete: (id: string) => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, onClick, onDelete }) => {
  const [offset, setOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      // Only allow swiping left (negative deltaX)
      if (eventData.deltaX < 0) {
        setOffset(eventData.deltaX);
      }
    },
    onSwipedLeft: (eventData) => {
      if (eventData.deltaX < -100) {
        // Threshold met
        handleDelete();
      } else {
        // Snap back
        setOffset(0);
      }
    },
    onSwipedRight: () => setOffset(0), // Snap back if swiped right
    onTap: () => onClick(receipt), // Handle click
    trackMouse: true,
    delta: 10, // Min distance
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    // Slight delay for animation
    setTimeout(() => {
        onDelete(receipt.id);
    }, 300);
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
    <div className="swipe-container">
      <div className="delete-background">
        <span>🗑️ Delete</span>
      </div>
      <div 
        className="receipt-card"
        {...handlers}
        style={{ 
            transform: `translateX(${offset}px)`,
            opacity: isDeleting ? 0 : 1,
            transition: isDeleting ? 'all 0.3s ease' : (offset === 0 ? 'transform 0.3s ease' : 'none')
        }}
      >
        <div className="card-header">
          <span className="store-name">{receipt.storeName || 'Unknown Store'}</span>
          <span className="receipt-date">{receipt.date}</span>
        </div>
        <div className="card-amount">
          {formatCurrency(receipt.totalAmount, receipt.currency)}
        </div>
        {receipt.category && (
          <span className="card-category">{receipt.category}</span>
        )}
      </div>
    </div>
  );
};
