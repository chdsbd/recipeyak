export function DragIcon() {
  const size = 18
  return (
    <svg
      className="shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="5" r="1" />
      <circle cx="8" cy="12" r="1" />
      <circle cx="8" cy="19" r="1" />

      <circle cx="16" cy="5" r="1" />
      <circle cx="16" cy="12" r="1" />
      <circle cx="16" cy="19" r="1" />
    </svg>
  )
}

export const Chevron = () => (
  <svg
    style={{ width: "1.5em" }}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path
        fill="inherit"
        d="M14.1711599,9.3535 L9.99925636,13.529 L5.82735283,9.3535 C5.51262415,9.0385 5.73543207,8.5 6.18054835,8.5 L13.8179644,8.5 C14.2630807,8.5 14.4858886,9.0385 14.1711599,9.3535"
      />
    </g>
  </svg>
)

const Clock = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-clock"
  >
    <circle cx={12} cy={12} r={10} />
    <path d="M12 6v6l4 2" />
  </svg>
)

export default Clock
