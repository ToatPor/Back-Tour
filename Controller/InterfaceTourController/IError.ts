export interface IError {
  message: string;
  errorCode: number;
  errorStatus: string;
  isOperation: boolean;
}
export interface IDevError extends IError {
  stack: string;
}
export interface IProductError extends IError {
  name?: string;
  path?: string;
  value?: { id: string };
  code?: number;
  keyValue?: { name?: string; email?: string };
  errors?: Record<string, any>;
}
