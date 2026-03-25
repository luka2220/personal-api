interface DBOperationErrorInfo {
  table: string;
  operation: 'list' | 'get' | 'delete' | 'put';
}

/** Error indicating a DB operation error */
export class DBOperationError extends Error {
  constructor(
    message: string,
    public readonly info: DBOperationErrorInfo
  ) {
    super(message);
    this.name = 'DBOperationError';
    this.info = info;
  }
}
