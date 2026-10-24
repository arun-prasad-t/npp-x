type Props = { size?: number; className?: string };

export function Logo({ size = 22, className }: Props) {
  return (
    <img
      src="/logo.svg"
      width={size}
      height={size}
      alt="npp-x"
      className={className}
      draggable={false}
    />
  );
}
