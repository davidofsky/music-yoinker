import { useContext } from "react"
import axios from "axios"
import { LoadingCtx } from "@/app/context"

type ApiCallOptions<T> = {
  onSuccess?: (data: T) => void
  onError?: (error: unknown) => void
}

export const useApiCall = () => {
  const [, setLoading] = useContext(LoadingCtx)!

  const call = async <T,>(
    method: "get" | "post" | "delete",
    url: string,
    params?: unknown,
    options?: ApiCallOptions<T>
  ): Promise<T | null> => {
    setLoading(true)
    try {
      let result
      if (method === "get") {
        result = await axios.get(url, { params })
      } else if (method === "post") {
        result = await axios.post(url, params)
      } else if (method === "delete") {
        result = await axios.delete(url, { params })
      }

      options?.onSuccess?.(result?.data)
      return result?.data ?? null
    } catch (error) {
      console.error(`API call failed: ${method} ${url}`, error)
      options?.onError?.(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { call }
}
