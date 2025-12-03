import { AISpecialist } from '../AISpecialist';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
const pdf = require('pdf-parse');

// Mock dependencies
jest.mock('fs');
jest.mock('pdf-parse', () => jest.fn());
jest.mock('@google/generative-ai');

describe('AISpecialist', () => {
  let aiSpecialist: AISpecialist;
  const mockGenerateContent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'mock-api-key';

    // Setup mock for GoogleGenerativeAI
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }));

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Gemini Response',
      },
    });

    aiSpecialist = new AISpecialist();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('should be defined', () => {
    expect(aiSpecialist).toBeDefined();
  });

  it('should process a request using Gemini when API key is present', async () => {
    const prompt = 'Generate a strategy';
    const response = await aiSpecialist.processRequest({ prompt });

    expect(response.content).toBe('Gemini Response');
    expect(response.metadata?.model).toBe('gemini-2.0-flash');
    expect(GoogleGenerativeAI).toHaveBeenCalledWith('mock-api-key');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should fallback to mock response if API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    // Re-instantiate to trigger constructor check
    const localSpecialist = new AISpecialist();
    
    const prompt = 'Generate a strategy';
    const response = await localSpecialist.processRequest({ prompt });

    expect(response.content).toContain(`[AI Response]: ${prompt}`);
    expect(response.metadata?.model).toBe('mock-model-v2');
  });

  it('should fallback to mock response if Gemini API fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API Error'));

    const prompt = 'Generate a strategy';
    const response = await aiSpecialist.processRequest({ prompt });

    expect(response.content).toContain('[Error interacting with AI Provider]');
    expect(response.content).toContain(`[AI Response]: ${prompt}`);
  });

  it('should extract text from a PDF and include it in the prompt sent to Gemini', async () => {
    const mockPdfText = 'This is content from a PDF.';
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('fake-pdf-data'));
    (pdf as jest.Mock).mockResolvedValue({ text: mockPdfText });

    const prompt = 'Analyze PDF';
    await aiSpecialist.processRequest({
      prompt,
      files: [{ path: 'test.pdf', mimeType: 'application/pdf' }]
    });

    expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(mockPdfText));
  });
  
  it('should include additional context in the prompt', async () => {
    const prompt = 'Refine this';
    const context = { previousAttempt: 'failed', score: 10 };
    await aiSpecialist.processRequest({ prompt, context });
    
    // Verify that the JSON stringified context is part of the prompt sent to Gemini
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('"previousAttempt": "failed"'));
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('"score": 10'));
  });
});
