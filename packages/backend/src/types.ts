/**
 * Represents a product or service that is part of a Strategic Initiative.
 */
export interface Solution {
  id: string;
  name: string;
  description: string;
  // The type of product, e.g., a recurring subscription or a one-time license.
  type: 'subscription' | 'licensed' | 'custom_service';
}

/**
 * Represents a high-level Strategic Initiative (SI).
 */
export interface StrategicInitiative {
  id: string;
  name: string;
  description: string;
  // The client use case that this SI is designed to solve.
  clientUseCase: string;
  // An array of solutions that are part of this initiative.
  solutions: Solution[];
  // A flexible key-value map for any required inputs or parameters for the SI.
  requiredInputs: Record<string, any>;
  // Positional data for rendering the SI on a visual canvas.
  visualRepresentation: {
    x: number;
    y: number;
  };
}
