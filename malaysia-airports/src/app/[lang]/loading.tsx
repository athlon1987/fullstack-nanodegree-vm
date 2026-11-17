import { Container } from '@/components/ui/container';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

/**
 * The fallback while a page streams in (pages with params that were not prerendered). It has no
 * copy of its own: the shell around it is already on screen.
 */
export default function Loading() {
  return (
    <Container className="py-10 sm:py-14" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-5 h-12 w-full max-w-xl" />
      <div className="mt-6 max-w-reading">
        <SkeletonText lines={3} />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </Container>
  );
}
