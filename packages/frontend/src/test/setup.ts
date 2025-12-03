import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock for scrollTo
Element.prototype.scrollIntoView = vi.fn();
