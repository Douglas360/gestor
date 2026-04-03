export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ overflow: 'auto', height: '100vh' }}>
      {children}
    </div>
  );
}
