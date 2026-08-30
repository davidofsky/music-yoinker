import { Spin } from "antd";
import { useContext } from "react";
import { LoadingCtx } from "@/app/context";

const Loading = () => {
  const [loading] = useContext(LoadingCtx)!;

  return <Spin size="large" description="Retrieving data..." fullscreen spinning={loading} />
}

export default Loading
