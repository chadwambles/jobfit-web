export const metadata = {
  title: "What your postings actually ask for",
  description:
    "Paste the job postings you are chasing. Get what that market demands, measured, " +
    "the gap against what you can already prove, and the projects that close the most of it.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
