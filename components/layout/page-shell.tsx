export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}