export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon size={40} className="mx-auto text-wood-300 dark:text-wood-600 mb-3" />}
      <h3 className="text-sm font-medium text-parchment-600 dark:text-wood-300">{title}</h3>
      {description && <p className="text-xs text-wood-400 dark:text-wood-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
