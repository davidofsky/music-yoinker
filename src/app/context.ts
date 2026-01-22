import { DisplayItem } from "@/lib/interfaces";
import { createContext, Dispatch, SetStateAction } from "react";
import { IArtist } from "./interfaces/artist.interface";

export const OpenAlbumCtx = createContext<[ DisplayItem | null, Dispatch<SetStateAction<DisplayItem | null>>]|undefined>(undefined)
export const OpenArtistCtx = createContext<[ IArtist | null, Dispatch<SetStateAction<IArtist | null>>]|undefined>(undefined)
export const OpenQueueCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
export const LoadingCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
