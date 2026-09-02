export type ClassNameValue = ClassNameArray | string | null | undefined | 0 | 0n | false
export type ClassNameArray = readonly ClassNameValue[]
export type ClassValue = ClassArray | ClassDictionary | string | number | bigint | null | boolean | undefined
export type ClassArray = ClassValue[]
export interface ClassDictionary { [id: string]: unknown }
export type CnFunction = (...inputs: ClassValue[]) => string

export declare const cn: CnFunction
export declare const twMerge: (...inputs: ClassNameValue[]) => string
export declare const twJoin: (...inputs: ClassNameValue[]) => string
export declare const clsx: (...inputs: ClassValue[]) => string
