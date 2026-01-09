import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
  delay?: number;
}

const StatsCard = ({ title, value, icon: Icon, trend, className, iconClassName, delay = 0 }: StatsCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/\D/g, '')) || 0;
  const isPercentage = typeof value === 'string' && value.includes('%');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;
    
    const duration = 1000;
    const steps = 30;
    const stepValue = numericValue / steps;
    let current = 0;
    
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(interval);
  }, [numericValue, isVisible]);

  return (
    <div 
      className={cn(
        "group relative rounded-xl bg-card p-3 sm:p-4 border border-border/50 overflow-hidden",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10",
        "hover:border-primary/30",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated corner accent */}
      <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full transform translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6 group-hover:translate-x-2 sm:group-hover:translate-x-3 group-hover:-translate-y-2 sm:group-hover:-translate-y-3 transition-transform duration-500" />

      <div className="relative flex items-center justify-between gap-2 sm:gap-3">
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground counter">
            {isPercentage ? `${displayValue}%` : displayValue}
          </p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold",
              trend.isPositive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              <span className={cn(
                "w-0 h-0 border-l-[2px] sm:border-l-[3px] border-r-[2px] sm:border-r-[3px] border-transparent",
                trend.isPositive 
                  ? "border-b-[2px] sm:border-b-[3px] border-b-success" 
                  : "border-t-[2px] sm:border-t-[3px] border-t-destructive"
              )} />
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-500 shrink-0",
          "group-hover:scale-110 group-hover:shadow-lg",
          iconClassName || "bg-gradient-to-br from-primary to-primary/80"
        )}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white transition-transform duration-500 group-hover:scale-110" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;