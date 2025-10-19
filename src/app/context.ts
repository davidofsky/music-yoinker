import { Album } from "@/lib/interfaces";
import { createContext, Dispatch, SetStateAction } from "react";

export const OpenAlbumCtx = createContext<[Album | null, Dispatch<SetStateAction<Album | null>>]|undefined>(undefined)
export const OpenQueueCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
export const LoadingCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
