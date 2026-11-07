const CHEMINS = {
  modifier: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  indispo: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  activer: <path d="M20 6 9 17l-5-5" />,
  desactiver: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </>
  ),
  clim: (
    <>
      <path d="M12 2v20" />
      <path d="m4.9 6.5 14.2 11" />
      <path d="m4.9 17.5 14.2-11" />
    </>
  ),
  wifi: (
    <>
      <path d="M2 8.8a15 15 0 0 1 20 0" />
      <path d="M5 12.6a10 10 0 0 1 14 0" />
      <path d="M8.5 16.1a5 5 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </>
  ),
  minibar: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 10h16" />
      <path d="M9 6.5h.01" />
      <path d="M9 14h.01" />
    </>
  ),
  balcon: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V10" />
      <path d="M19 21V10" />
      <path d="M3 10h18" />
      <path d="M9 10V4h6v6" />
    </>
  ),
};

export default function Icone({ nom }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CHEMINS[nom]}
    </svg>
  );
}