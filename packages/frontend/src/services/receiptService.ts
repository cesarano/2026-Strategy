import axios from 'axios';

// Mirror the backend's ImageProcessingOptions for type safety
export interface ImageProcessingOptions {
  resize?: {
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  crop?: {
      left: number;
      top: number;
      width: number;
      height: number;
  };
  format?: {
      type: 'jpeg' | 'png' | 'webp' | 'gif' | 'tiff' | 'avif';
      options?: object; // sharp's format options are complex, keep as object for frontend simplicity
  };
  grayscale?: boolean;
  sharpen?: object | boolean; // sharp.SharpenOptions or true
  noiseReduction?: number;
  stripMetadata?: boolean;
}

export interface ReceiptItem {
  name: string;
  price: number | null;
  quantity?: number;
}

export interface ReceiptData {
  id: string;
  storeName: string | null;
  date: string | null;
  totalAmount: number | null;
  currency: string | null;
  category: string | null;
  items: ReceiptItem[];
  originalImageUrl: string;
  optimizedImageUrl?: string;
  displayImageUrl: string;
  createdAt: string;
}

// Use relative path, relying on Vite proxy
const API_BASE_URL = '/api/receipts';

export const getReceipts = async (): Promise<ReceiptData[]> => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const uploadReceipt = async (file: File): Promise<ReceiptData> => {
  const formData = new FormData();
  formData.append('receiptImage', file);

  const response = await axios.post(API_BASE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteReceipt = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${id}`);
};

// Renamed and updated to accept ImageProcessingOptions
export const cropEnhanceReceiptImage = async (id: string, options: ImageProcessingOptions): Promise<{ message: string; displayImageUrl: string }> => {
  const response = await axios.post(`${API_BASE_URL}/${id}/crop-enhance`, options);
  return response.data;
};

export const downloadReceiptImage = (id: string) => {
  window.open(`${API_BASE_URL}/${id}/download-image`, '_blank');
};

export const setDisplayImageVersion = async (id: string, version: 'original' | 'optimized'): Promise<{ message: string; displayImageUrl: string }> => {
  const response = await axios.post(`${API_BASE_URL}/${id}/set-display-image`, { version });
  return response.data;
};

export const updateReceipt = async (id: string, updatedData: Partial<ReceiptData>): Promise<ReceiptData> => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, updatedData);
    return response.data;
};

