import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../../apps/strategy/components/ChatInterface';
import * as aiService from '../../services/aiService';
import '@testing-library/jest-dom';

// Mock the aiService
vi.mock('../../services/aiService');

describe('ChatInterface', () => {
  it('renders input field and send button', () => {
    const mockOnSessionUpdate = vi.fn();
    const mockOnSessionCreated = vi.fn();
    render(<ChatInterface onSessionUpdate={mockOnSessionUpdate} onSessionCreated={mockOnSessionCreated} />);
    expect(screen.getByPlaceholderText(/Ask about strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/Send/i)).toBeInTheDocument();
  });

  it('allows user to type and send a message', async () => {
    const mockResponse = {
      content: 'This is an AI response',
      sessionId: 'mock-session-id',
      metadata: { timestamp: '2025-12-03', model: 'mock', filesProcessed: 0 }
    };
    
    (aiService.sendMessage as any).mockResolvedValue(mockResponse);

    const mockOnSessionUpdate = vi.fn();
    const mockOnSessionCreated = vi.fn();
    render(<ChatInterface onSessionUpdate={mockOnSessionUpdate} onSessionCreated={mockOnSessionCreated} />);
    
    const input = screen.getByPlaceholderText(/Ask about strategy/i);
    const button = screen.getByText(/Send/i);

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(button);

    // Check if user message is displayed
    expect(screen.getByText('Hello AI')).toBeInTheDocument();

    // Check if loading state might be briefly present (optional)
    
    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText('This is an AI response')).toBeInTheDocument();
    });

    // Initial call has undefined sessionId
    expect(aiService.sendMessage).toHaveBeenCalledWith('Hello AI', [], undefined, undefined);
  });
});
