export interface SerializedSaveQueueOptions<T> { delay?: number; save: (value: T) => Promise<unknown> | unknown; onError?: (error: unknown) => void }
export interface SerializedSaveQueue<T> { enqueue(value: T): Promise<void>; flush(): Promise<void>; cancel(): void; readonly pending: boolean }
export function createSerializedSaveQueue<T>(options: SerializedSaveQueueOptions<T>): SerializedSaveQueue<T>
