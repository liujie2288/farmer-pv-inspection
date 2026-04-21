interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 6, md: 8, lg: 12 };

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const s = sizeMap[size];
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className={`${s <= 6 ? 'w-6 h-6' : s <= 8 ? 'w-8 h-8' : 'w-12 h-12'} border-4 border-gray-200 border-t-teal rounded-full animate-spin`}
      />
    </div>
  );
}
