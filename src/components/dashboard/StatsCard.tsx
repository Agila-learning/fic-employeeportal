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
        "group relative rounded-2xl bg-card p-6 border border-border/50 overflow-hidden",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10",
        "hover:border-primary/30",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-foreground counter">
            {isPercentage ? `${displayValue}%` : displayValue}
          </p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
              trend.isPositive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              <span className={cn(
                "w-0 h-0 border-l-4 border-r-4 border-transparent",
                trend.isPositive 
                  ? "border-b-4 border-b-success" 
                  : "border-t-4 border-t-destructive"
              )} />
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500",
          "group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg",
          iconClassName || "bg-gradient-to-br from-primary to-primary/80"
        )}>
          <Icon className="h-7 w-7 text-white transition-transform duration-500 group-hover:scale-110" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;