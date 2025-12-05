import React from 'react';
import { ReceiptData } from '../../../services/receiptService';
import { ReceiptCard } from './ReceiptCard';
import { format, parseISO, isValid } from 'date-fns';
import './ReceiptList.css';

export type ViewMode = 'day' | 'month' | 'year';

interface ReceiptListProps {
  receipts: ReceiptData[];
  viewMode: ViewMode;
  onReceiptClick: (receipt: ReceiptData) => void;
  onDelete: (id: string) => void;
}

export const ReceiptList: React.FC<ReceiptListProps> = ({ receipts, viewMode, onReceiptClick, onDelete }) => {
  
  const getGroupKey = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown Date';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return 'Unknown Date';

      switch (viewMode) {
        case 'day': return format(date, 'yyyy-MM-dd');
        case 'month': return format(date, 'yyyy-MM');
        case 'year': return format(date, 'yyyy');
        default: return 'Unknown Date';
      }
    } catch {
      return 'Unknown Date';
    }
  };

  const formatGroupLabel = (key: string) => {
    if (key === 'Unknown Date') return key;
    try {
      switch (viewMode) {
        case 'day': return format(parseISO(key), 'EEEE, MMMM d, yyyy'); // "Monday, December 4, 2025"
        case 'month': return format(parseISO(key + '-01'), 'MMMM yyyy'); // "December 2025"
        case 'year': return key; // "2025"
        default: return key;
      }
    } catch {
      return key;
    }
  };

  // Grouping Logic
  const groupedReceipts: Record<string, ReceiptData[]> = {};
  receipts.forEach(receipt => {
    const key = getGroupKey(receipt.date || receipt.createdAt);
    if (!groupedReceipts[key]) {
      groupedReceipts[key] = [];
    }
    groupedReceipts[key].push(receipt);
  });

  // Sort keys descending
  const sortedKeys = Object.keys(groupedReceipts).sort().reverse();

  return (
    <div className="receipt-grouped-list">
      {sortedKeys.map(key => (
        <div key={key} className="receipt-group">
          <h3 className="group-header">{formatGroupLabel(key)}</h3>
          <div className="group-grid">
            {groupedReceipts[key].map(receipt => (
              <ReceiptCard 
                key={receipt.id} 
                receipt={receipt} 
                onClick={onReceiptClick} 
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
