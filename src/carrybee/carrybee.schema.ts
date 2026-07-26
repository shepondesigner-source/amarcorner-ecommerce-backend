import { z } from "zod";

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    contact_person_name: z.string().min(1),
    contact_person_number: z.string().min(11),
    contact_person_secondary_number: z.string().optional(),
    address: z.string().min(1),
    city_id: z.number().int().positive(),
    zone_id: z.number().int().positive(),
    area_id: z.number().int().positive().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    average_daily_pickup: z.number().nonnegative().default(0),
    is_default_pickup_store: z.boolean().default(false),
    is_default_return_store: z.boolean().default(false),
  }),
});

export const createCarrybeeOrderSchema = z.object({
  body: z.object({
    store_id: z.string().min(1),
    merchant_order_id: z.string().max(50).optional(),
    delivery_type: z.number().int().min(1).max(2).default(1),
    product_type: z.number().int().min(1).max(3).default(1),
    recipient_name: z.string().min(2).max(99),
    recipient_phone: z.string().min(11),
    recipient_secendary_phone: z.string().optional(),
    recipient_address: z.string().min(10).max(200),
    city_id: z.number().int().positive(),
    zone_id: z.number().int().positive(),
    area_id: z.number().int().positive().optional(),
    special_instruction: z.string().max(255).optional(),
    product_description: z.string().max(255).optional(),
    item_weight: z.number().int().min(1).max(25000),
    item_quantity: z.number().int().min(1).max(200).optional(),
    collectable_amount: z.number().int().min(0).max(100000).optional(),
    is_closed_box: z.boolean().default(false),
    is_exchange: z.boolean().default(false),
  }),
});

export const createCarrybeeFromOrderSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    cityId: z.number().int().positive(),
    zoneId: z.number().int().positive(),
    areaId: z.number().int().positive().optional(),
    deliveryType: z.number().int().min(1).max(2).default(1),
    itemWeight: z.number().int().min(1).max(25000).default(500),
  }),
});

export const trackCarrybeeOrderSchema = z.object({
  params: z.object({
    consignmentId: z.string().min(1),
  }),
});

export const getZonesSchema = z.object({
  query: z.object({
    city_id: z.coerce.number().int().positive(),
  }),
});

export const getAreasSchema = z.object({
  query: z.object({
    city_id: z.coerce.number().int().positive(),
    zone_id: z.coerce.number().int().positive(),
  }),
});
