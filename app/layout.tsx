import "./globals.css";
export const metadata = {
  title: "The Mirrors · The Mirror Castle",
  description: "A local tabletop adventure in the castle of Occuldor.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
