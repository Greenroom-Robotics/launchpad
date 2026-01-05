import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@app/main';

export const trpc = createTRPCReact<AppRouter>();
