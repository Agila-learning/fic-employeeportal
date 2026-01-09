import { Badge } from '@/components/ui/badge';
import { LeadStatus, STATUS_OPTIONS } from '@/types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

const statusVariantMap: Record<LeadStatus, 'nc1' | 'nc2' | 'nc3' | 'followUp' | 'success' | 'rejected' | 'notInterested' | 'notInterestedPaid' | 'differentDomain'> = {
  nc1: 'nc1',
  nc2: 'nc2',
  nc3: 'nc3',
  follow_up: 'followUp',
  success: 'success',
  converted: 'success', // Legacy mapping - converted now shows as success
  rejected: 'rejected',
  not_interested: 'notInterested',
  not_interested_paid: 'notInterestedPaid',
  different_domain: 'differentDomain',
};

const LeadStatusBadge = ({ status }: LeadStatusBadgeProps) => {
  const statusOption = STATUS_OPTIONS.find(s => s.value === status);
  const variant = statusVariantMap[status];

  return (
    <Badge variant={variant}>
      {statusOption?.label || status}
    </Badge>
  );
};

export default LeadStatusBadge;
