import { Request, Response } from "express";
import { SmsService } from "./sms.service";

export const sendSms = async (req: Request, res: Response) => {
  const { contacts, message, type, label } = req.body;
  const result = await SmsService.send({ contacts, message, type, label });
  res.status(201).json(result);
};

export const getSmsBalance = async (req: Request, res: Response) => {
  const result = await SmsService.getBalance();
  res.json(result);
};

export const getSmsPrice = async (req: Request, res: Response) => {
  const result = await SmsService.getPrice();
  res.json(result);
};

export const getSmsDeliveryReport = async (req: Request, res: Response) => {
  const result = await SmsService.getDeliveryReport(req.params.shootId);
  res.json(result);
};

export const getSmsUnreadReplies = async (req: Request, res: Response) => {
  const result = await SmsService.getUnreadReplies();
  res.json(result);
};
