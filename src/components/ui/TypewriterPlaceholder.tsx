import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypewriterPlaceholderProps {
  placeholders: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const TypewriterPlaceholder = ({ 
  placeholders, 
  value, 
  onChange,
  className 
}: TypewriterPlaceholderProps) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPlaceholder = placeholders[currentPlaceholderIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentPlaceholder.length) {
          setDisplayText(currentPlaceholder.slice(0, displayText.length + 1));
        } else {
          // Wait before starting to delete
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentPlaceholderIndex, placeholders]);

  return (
    <div className="relative w-full group">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        placeholder={displayText + '|'}
        value={value}
        onChange={onChange}
        className={cn("pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20", className)}
      />
    </div>
  );
};

export default TypewriterPlaceholder;
