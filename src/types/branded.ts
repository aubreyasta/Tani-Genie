export type Brand<T, B extends string> = T & { readonly __brand: B };

export type FarmerId = Brand<string, 'FarmerId'>;
export type PlotId = Brand<string, 'PlotId'>;
export type PlantingId = Brand<string, 'PlantingId'>;
export type CropId = Brand<string, 'CropId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type DeliveryId = Brand<string, 'DeliveryId'>;
