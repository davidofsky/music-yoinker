import { DisplayItem } from "@/lib/interfaces";
import { createContext, Dispatch, SetStateAction } from "react";
import { ITrack } from "./interfaces/track.interface";

export const OpenAlbumCtx = createContext<[ DisplayItem | null, Dispatch<SetStateAction<DisplayItem | null>>]|undefined>(undefined)
export const OpenQueueCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
export const QueueCtx = createContext<ITrack[] | undefined>(undefined)
export const LoadingCtx = createContext<[boolean,Dispatch<SetStateAction<boolean>>]|undefined>(undefined)
