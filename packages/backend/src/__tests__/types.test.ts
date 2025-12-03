import { Solution, StrategicInitiative } from '../types';

describe('Data Models', () => {
  it('should be possible to create a Solution object', () => {
    const solution: Solution = {
      id: 'sol-1',
      name: 'Test Solution',
      description: 'A solution for testing purposes',
      type: 'subscription',
    };
    expect(solution.id).toBe('sol-1');
    expect(solution.type).toBe('subscription');
  });

  it('should be possible to create a StrategicInitiative object', () => {
    const solution: Solution = {
      id: 'sol-1',
      name: 'Test Solution',
      description: 'A solution for testing purposes',
      type: 'subscription',
    };

    const initiative: StrategicInitiative = {
      id: 'si-1',
      name: 'Test Initiative',
      description: 'An initiative for testing purposes',
      clientUseCase: 'A use case for testing',
      solutions: [solution],
      requiredInputs: {
        param1: 'value1',
        param2: 123,
      },
      visualRepresentation: {
        x: 100,
        y: 200,
      },
    };

    expect(initiative.id).toBe('si-1');
    expect(initiative.solutions.length).toBe(1);
    expect(initiative.solutions[0].name).toBe('Test Solution');
    expect(initiative.requiredInputs.param2).toBe(123);
    expect(initiative.visualRepresentation.x).toBe(100);
  });
  it('should allow all defined Solution types', () => {
    const subscriptionSolution: Solution = { id: 'sol-sub', name: 'Sub', description: 'desc', type: 'subscription' };
    const licensedSolution: Solution = { id: 'sol-lic', name: 'Lic', description: 'desc', type: 'licensed' };
    const customServiceSolution: Solution = { id: 'sol-cs', name: 'CS', description: 'desc', type: 'custom_service' };

    expect(subscriptionSolution.type).toBe('subscription');
    expect(licensedSolution.type).toBe('licensed');
    expect(customServiceSolution.type).toBe('custom_service');
  });

  it('should handle various data types in StrategicInitiative requiredInputs', () => {
    const initiative: StrategicInitiative = {
      id: 'si-2',
      name: 'Test Initiative 2',
      description: 'Another initiative for testing purposes',
      clientUseCase: 'Advanced testing use case',
      solutions: [],
      requiredInputs: {
        stringParam: 'testString',
        numberParam: 42,
        booleanParam: true,
        nullParam: null,
        objectParam: { key: 'value' },
        arrayParam: [1, 2, 3],
      },
      visualRepresentation: { x: 10, y: 20 },
    };

    expect(initiative.requiredInputs.stringParam).toBe('testString');
    expect(initiative.requiredInputs.numberParam).toBe(42);
    expect(initiative.requiredInputs.booleanParam).toBe(true);
    expect(initiative.requiredInputs.nullParam).toBeNull();
    expect(initiative.requiredInputs.objectParam).toEqual({ key: 'value' });
    expect(initiative.requiredInputs.arrayParam).toEqual([1, 2, 3]);
  });

  it('should handle an empty solutions array in StrategicInitiative', () => {
    const initiative: StrategicInitiative = {
      id: 'si-3',
      name: 'Test Initiative 3',
      description: 'Initiative with no solutions',
      clientUseCase: 'No solutions needed',
      solutions: [],
      requiredInputs: {},
      visualRepresentation: { x: 50, y: 60 },
    };

    expect(initiative.solutions).toEqual([]);
    expect(initiative.solutions.length).toBe(0);
  });
});

