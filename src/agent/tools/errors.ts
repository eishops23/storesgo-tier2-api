// Agent Suite — Tool framework error types (Phase 0 Part C)

export class ToolNotFoundError extends Error {
  constructor(public readonly toolName: string) {
    super(`Tool not found: ${toolName}`);
    this.name = 'ToolNotFoundError';
  }
}

export class ToolArgsInvalidError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly issues: unknown,
  ) {
    super(`Invalid arguments for tool ${toolName}: ${JSON.stringify(issues)}`);
    this.name = 'ToolArgsInvalidError';
  }
}

export class ToolAutonomyBlockedError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly currentLevel: string,
    public readonly requiredLevel: string,
  ) {
    super(
      `Tool ${toolName} requires autonomy level ${requiredLevel} but feature is at ${currentLevel}`,
    );
    this.name = 'ToolAutonomyBlockedError';
  }
}

export class ToolExecutionError extends Error {
  constructor(
    public readonly toolName: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`Tool ${toolName} execution failed: ${message}`);
    this.name = 'ToolExecutionError';
  }
}

export class ToolTimeoutError extends ToolExecutionError {
  constructor(
    toolName: string,
    public readonly timeoutMs: number,
  ) {
    super(toolName, `Timed out after ${timeoutMs}ms`);
    this.name = 'ToolTimeoutError';
  }
}
