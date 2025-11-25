import { Layout } from "antd";
import React from "react";

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  return (
    <>
      <style>{`
        @media (max-width: 499.98px) {
          .handi-footer .handi-logo { height: 26px !important; }
        }
      `}</style>
      <AntFooter
        className="handi-footer text-center py-8"
        style={{
          backgroundColor: "#ffffff",
          color: "#666666",
        }}
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Handi Logo */}
          <div className="flex items-center justify-center">
            <img
              src="/images/handi-logo.png"
              alt="Handi Logo"
              className="handi-logo h-8 w-auto"
            />
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-gray-300"></div>

          {/* Copyright Text */}
          <p className="text-gray-600 text-sm">Copyright ©2025 Handi</p>
        </div>
      </AntFooter>
    </>
  );
};

export default Footer;
