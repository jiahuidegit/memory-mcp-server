import type { Context } from 'hono';

/**
 * 全局错误处理器
 */
export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  // 区分不同类型的错误
  if (err.message.includes('缺少')) {
    return c.json(
      {
        error: 'Bad Request',
        message: err.message,
      },
      400
    );
  }

  if (err.message.includes('未找到') || err.message.includes('不存在')) {
    return c.json(
      {
        error: 'Not Found',
        message: err.message,
      },
      404
    );
  }

  // 默认500错误
  return c.json(
    {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    },
    500
  );
}
