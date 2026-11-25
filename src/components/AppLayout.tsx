import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";

export const AppLayout = () => <>
  <Header />
  <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
    <WorkspaceSidebar />
    <div className="min-w-0 flex-1"><Outlet /></div>
  </div>
</>;
