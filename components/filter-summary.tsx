export function FilterSummary({ items }: { items: string[] }) {
  return (
    <div className="summary-list">
      {items.map((item) => (
        <div className="summary-row" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}
