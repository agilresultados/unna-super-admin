import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footer?: React.ReactNode;
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = (props) => {
  const { 
    className,
    contentClassName,
    headerClassName,
    children,
    isOpen, 
    onClose, 
    size = 'md',
    title,
    subtitle,
    icon,
    showCloseButton = true,
    footer,
    zIndex,
  } = props;
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        bottom: 0, 
        left: 0,
        zIndex: zIndex || 1000
      }}
    >
      {/* Backdrop - Explicitly at root body via portal, should cover everything */}
      <div 
        className="absolute inset-0 bg-black/75 animate-fade-in"
        onClick={onClose}
        style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          bottom: 0, 
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: -1
        }}
      />
      
      {/* Modal - Centered */}
      <div className={cn(
        "relative bg-card text-card-foreground rounded-[2rem] shadow-2xl border border-border w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 ring-1 ring-teal-main/10", 
        sizeClasses[size],
        className
      )}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn("flex items-center justify-between border-b border-border bg-card sticky top-0 z-10", headerClassName || "p-6 md:p-8")}>
            <div className="flex items-center gap-4">
              {icon && (
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <div className="text-primary">{icon}</div>
                </div>
              )}
              <div>
                {title && (
                  <h2 className="text-xl font-bold text-foreground leading-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors bg-muted rounded-full hover:bg-teal-hover-bg"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={cn("p-6 overflow-y-auto flex-1 no-scrollbar", contentClassName)}>
          {children}
        </div>

        {/* Optional Fixed Footer */}
        {footer && (
          <div className="border-t border-border bg-card mt-auto">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};


export { Modal };

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-8", className)}>
    {children}
  </div>
);

export default Modal;