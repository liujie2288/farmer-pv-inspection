interface StatusTagProps {
  inspected: boolean;
}

export default function StatusTag({ inspected }: StatusTagProps) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
        inspected
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      {inspected ? '已巡检' : '未巡检'}
    </span>
  );
}
