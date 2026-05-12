import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = (result.error as unknown as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
      return res.status(400).json({
        error: 'Validation error',
        details: issues.map((e: { path: (string | number)[]; message: string }) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}
