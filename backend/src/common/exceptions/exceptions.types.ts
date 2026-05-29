export type ErrorResponse = {
  success: false;
  statusCode: number;
  title: string;
  message: string;
  code: string;
  errors: string[] | null;
};
