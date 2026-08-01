export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="grid min-h-screen place-items-center bg-[#f7f7f8] p-5">{children}</main>;
}
