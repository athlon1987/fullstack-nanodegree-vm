'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { IconButton } from './icon-button';

/** Dialog root: holds the open state. `<Dialog open={open} onOpenChange={setOpen}>`. */
export const Dialog = DialogPrimitive.Root;
/** Wrap the element that opens the dialog: `<DialogTrigger asChild><Button>...</Button></DialogTrigger>`. */
export const DialogTrigger = DialogPrimitive.Trigger;
/** Wrap any element that should close the dialog. */
export const DialogClose = DialogPrimitive.Close;

const MODAL_SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' } as const;

export interface DialogContentProps extends Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> {
  /** Required: every dialog has a title, announced when it opens. */
  title: string;
  /** Hide the title visually (it is still announced). */
  hideTitle?: boolean;
  description?: ReactNode;
  /**
   * `modal`: centred, for decisions and short forms.
   * `sheet`: a side panel on desktop and a bottom sheet on phones, for menus, filters and settings.
   */
  variant?: 'modal' | 'sheet';
  /** Width of a modal: sm 28rem, md 36rem (default), lg 48rem. */
  size?: keyof typeof MODAL_SIZES;
  /** Actions pinned to the bottom edge. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * The dialog surface. Focus is trapped inside and returns to the trigger on close; Escape and
 * the close button dismiss it.
 *
 * @example
 * <Dialog>
 *   <DialogTrigger asChild><Button variant="secondary">{t('preferences.open')}</Button></DialogTrigger>
 *   <DialogContent variant="sheet" title={t('preferences.title')}>...</DialogContent>
 * </Dialog>
 */
export function DialogContent({
  title,
  hideTitle = false,
  description,
  variant = 'modal',
  size = 'md',
  footer,
  className,
  children,
  ...rest
}: DialogContentProps) {
  const t = useT();
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-board/60 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'fixed z-50 flex flex-col border border-line-strong bg-surface-raised text-ink shadow-lg outline-none',
          variant === 'modal'
            ? [
                'inset-x-3 top-1/2 max-h-[calc(100dvh-1.5rem)] -translate-y-1/2 rounded-xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2',
                'data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in',
                MODAL_SIZES[size],
              ]
            : [
                'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-b-0 pb-[env(safe-area-inset-bottom)]',
                'data-[state=closed]:animate-sheet-out-bottom data-[state=open]:animate-sheet-in-bottom',
                'sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-[28rem] sm:max-w-[calc(100vw-3rem)] sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-b sm:pb-0',
                'sm:data-[state=closed]:animate-sheet-out-right sm:data-[state=open]:animate-sheet-in-right',
              ],
          className,
        )}
        {...rest}
      >
        <header className={cn('flex items-start justify-between gap-4 py-3 pr-3 pl-5 sm:pl-6', !hideTitle && 'border-b border-line')}>
          <div className={cn('min-w-0 py-1.5', hideTitle && 'sr-only')}>
            <DialogPrimitive.Title className="type-title-lg text-ink">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="type-body-sm mt-1 text-ink-2">{description}</DialogPrimitive.Description> : null}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton icon="x" label={t('common.actions.close')} className="ml-auto" />
          </DialogPrimitive.Close>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        {footer ? <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-4 sm:px-6">{footer}</footer> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Sheet: the same dialog, as a side panel on desktop and a bottom sheet on phones. */
export const Sheet = Dialog;
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;

/** `DialogContent` with `variant="sheet"`. */
export function SheetContent(props: Omit<DialogContentProps, 'variant' | 'size'>) {
  return <DialogContent variant="sheet" {...props} />;
}
