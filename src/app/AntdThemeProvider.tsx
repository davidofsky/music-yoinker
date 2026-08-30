"use client"
import { ConfigProvider, App, theme } from "antd";
import { ReactNode } from "react";

const PRIMARY_GREEN = "#2e7758";

const baseTokens = theme.getDesignToken({ algorithm: theme.darkAlgorithm, token: { colorPrimary: PRIMARY_GREEN } });

const themeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: PRIMARY_GREEN,
    borderRadius: 8,
    fontFamily: "inherit",
  },
  components: {
    Layout: {
      headerBg: baseTokens.colorBgContainer,
      bodyBg: baseTokens.colorBgLayout,
      siderBg: baseTokens.colorBgContainer,
    },
  },
};

const AntdThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ConfigProvider theme={themeConfig}>
      <App>{children}</App>
    </ConfigProvider>
  );
};

export default AntdThemeProvider;
