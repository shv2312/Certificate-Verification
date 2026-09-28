/**
 * PageContainer — Wraps page-level content with consistent vertical spacing.
 *
 * Use this around the main content of each page (between AppHeader and AppFooter).
 * The `narrow` prop switches to a narrower max-width suitable for forms.
 */

interface PageContainerProps {
  children: React.ReactNode;
  narrow?: boolean;
  className?: string;
}

export default function PageContainer({ children, narrow = false, className = '' }: PageContainerProps) {
  return (
    <main
      className={[
        narrow ? 'page-container' : 'section-container',
        'py-10 flex-1 animate-slide-up',
        className,
      ].join(' ')}
    >
      {children}
    </main>
  );
}
