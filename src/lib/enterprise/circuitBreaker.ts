/**
 * Circuit Breaker Pattern
 * Protects against cascading failures from external services
 */

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  nextAttempt: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;    // Failures before opening
  resetTimeoutMs: number;      // Time before trying again
  halfOpenRequests: number;    // Test requests in half-open state
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,      // 30 seconds
  halfOpenRequests: 3,
};

// Store circuit states by service name
const circuits = new Map<string, CircuitState>();

export function getCircuit(name: string): CircuitState {
  if (!circuits.has(name)) {
    circuits.set(name, {
      failures: 0,
      lastFailure: 0,
      state: "CLOSED",
      nextAttempt: 0,
    });
  }
  return circuits.get(name)!;
}

/**
 * Execute function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const circuit = getCircuit(serviceName);
  const now = Date.now();

  // Check if circuit is OPEN
  if (circuit.state === "OPEN") {
    if (now < circuit.nextAttempt) {
      throw new Error(`Circuit breaker OPEN for ${serviceName}. Retry after ${Math.ceil((circuit.nextAttempt - now) / 1000)}s`);
    }
    // Transition to HALF_OPEN
    circuit.state = "HALF_OPEN";
    console.log(`[CircuitBreaker] ${serviceName}: OPEN -> HALF_OPEN`);
  }

  try {
    const result = await fn();
    
    // Success - reset circuit
    if (circuit.state === "HALF_OPEN" || circuit.failures > 0) {
      circuit.failures = 0;
      circuit.state = "CLOSED";
      console.log(`[CircuitBreaker] ${serviceName}: Reset to CLOSED`);
    }
    
    return result;
  } catch (error) {
    circuit.failures++;
    circuit.lastFailure = now;

    if (circuit.failures >= cfg.failureThreshold) {
      circuit.state = "OPEN";
      circuit.nextAttempt = now + cfg.resetTimeoutMs;
      console.error(`[CircuitBreaker] ${serviceName}: OPEN after ${circuit.failures} failures`);
    }

    throw error;
  }
}

/**
 * Pre-configured circuit breakers for external services
 */
export const CircuitBreakers = {
  EasyPost: (fn: () => Promise<any>) => 
    withCircuitBreaker("easypost", fn, { failureThreshold: 3, resetTimeoutMs: 60000 }),
  
  SendGrid: (fn: () => Promise<any>) => 
    withCircuitBreaker("sendgrid", fn, { failureThreshold: 5, resetTimeoutMs: 30000 }),
  
  Twilio: (fn: () => Promise<any>) => 
    withCircuitBreaker("twilio", fn, { failureThreshold: 5, resetTimeoutMs: 30000 }),
  
  OpenAI: (fn: () => Promise<any>) => 
    withCircuitBreaker("openai", fn, { failureThreshold: 3, resetTimeoutMs: 60000 }),
  
  Clover: (fn: () => Promise<any>) => 
    withCircuitBreaker("clover", fn, { failureThreshold: 3, resetTimeoutMs: 30000 }),
};

export function getCircuitStatus(): Record<string, CircuitState> {
  const status: Record<string, CircuitState> = {};
  circuits.forEach((state, name) => {
    status[name] = { ...state };
  });
  return status;
}
