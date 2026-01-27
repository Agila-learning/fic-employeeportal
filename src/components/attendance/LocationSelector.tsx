import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin, Building2, Home, Navigation } from 'lucide-react';
import { WorkLocation, OFFICE_LOCATIONS } from '@/utils/geolocation';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  value: WorkLocation | null;
  onChange: (location: WorkLocation) => void;
  disabled?: boolean;
}

const locationIcons: Record<WorkLocation, React.ReactNode> = {
  krishnagiri: <Navigation className="h-4 w-4" />,
  tirupattur: <Navigation className="h-4 w-4" />,
  chennai: <Building2 className="h-4 w-4" />,
  bangalore: <Building2 className="h-4 w-4" />,
  wfh: <Home className="h-4 w-4" />,
};

const LocationSelector = ({ value, onChange, disabled }: LocationSelectorProps) => {
  const locations = Object.values(OFFICE_LOCATIONS);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Select Work Location
      </Label>
      <RadioGroup
        value={value || ''}
        onValueChange={(val) => onChange(val as WorkLocation)}
        disabled={disabled}
        className="grid grid-cols-2 gap-2"
      >
        {locations.map((location) => (
          <div key={location.id}>
            <RadioGroupItem
              value={location.id}
              id={location.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={location.id}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full mb-2",
                location.requiresGPS ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-primary/10 text-primary"
              )}>
                {locationIcons[location.id]}
              </div>
              <span className="text-xs font-medium text-center">{location.name}</span>
              {location.requiresGPS && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                  GPS Required
                </span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {value === 'krishnagiri' && (
        <div className="space-y-1">
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            GPS verification required - within 1km of either Krishnagiri office
          </p>
          <p className="text-[10px] text-muted-foreground pl-4">
            • KNT Manickam Road, New Bus Stand<br/>
            • RK Towers, Wahab Nagar
          </p>
        </div>
      )}
      {value === 'tirupattur' && (
        <div className="space-y-1">
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            GPS verification required - within 1km of Tirupattur office
          </p>
          <p className="text-[10px] text-muted-foreground pl-4">
            • Opposite Reliance Petrol Bunk, Vaniyambadi Main Road
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
