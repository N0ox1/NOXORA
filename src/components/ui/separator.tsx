import * as React from 'react';
import clsx from 'clsx';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
    function Separator({ className, orientation = 'horizontal', ...props }, ref) {
        return (
            <div
                ref={ref}
                className={clsx(
                    'shrink-0 bg-gray-200',
                    orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
                    className
                )}
                {...props}
            />
        );
    }
);

export default Separator;
