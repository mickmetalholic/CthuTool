import DashboardClient from "./dashboard-client";

export default function Home() {
  return <DashboardClient apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"} />;
}
