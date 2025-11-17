import { Artist, DisplayItem } from "@/lib/interfaces";
import { createContext, Dispatch, SetStateAction } from "react";

export const OpenAlbumCtx = createContext<[ DisplayItem | null, Dispatch<SetStateAction<DisplayItem | null>>]|undefined>(undefined)
export const OpenArtistCtx = createContext<[ Artist | null, Dispatch<SetStateAction<Artist | null>>]|undefined>(undefined)
export const OpenQueueCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
export const LoadingCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
