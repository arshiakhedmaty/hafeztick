/**
 * The mark is the same شمسه the app uses for a day, closed to a single
 * eight-petal rosette. Nothing else in the identity needs to be invented: the
 * thing the product draws every day is the thing it is named by.
 */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      className="shrink-0"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <path
          key={index}
          d="M 0 -13 C 7 -21, 8.5 -32, 0 -43 C -8.5 -32, -7 -21, 0 -13 Z"
          transform={`rotate(${index * 45})`}
          fill={index % 2 === 0 ? "var(--primary)" : "var(--accent)"}
        />
      ))}
      <circle
        cx="0"
        cy="0"
        r="13.5"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        opacity="0.4"
      />
      <circle cx="0" cy="0" r="9" fill="var(--primary)" />
    </svg>
  );
}
