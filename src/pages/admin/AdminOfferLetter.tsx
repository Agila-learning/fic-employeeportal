import DashboardLayout from '@/components/layout/DashboardLayout';

const AdminOfferLetter = () => {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Offer Letter Generator</h1>
        <div className="rounded-xl border border-border overflow-hidden bg-card" style={{ height: 'calc(100vh - 160px)' }}>
          <iframe
            src="https://offer-letter-generator-xi.vercel.app/"
            className="w-full h-full border-0"
            title="Offer Letter Generator"
            allow="clipboard-write"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOfferLetter;
