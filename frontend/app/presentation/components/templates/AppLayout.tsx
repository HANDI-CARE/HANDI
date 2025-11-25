import { Layout } from "antd";
import { useUserStore } from "../../stores/userStore";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useUserStore();

  return (
    <Layout className="min-h-screen">
      <Header />
      <Layout>
        <Sidebar />
        <Layout className="!min-h-screen bg-gray-50">
          <Content
            className={`max-w-7xl mx-auto w-full
            ${isAuthenticated ? "p-0 lg:p-6" : "p-0"}`}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
