import { Request, Response, NextFunction } from "express";
import * as appointmentService from "../services/appointmentService";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await appointmentService.listAppointments(req.query);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await appointmentService.bookAppointment(req.body);
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await appointmentService.getAppointment(req.params.id);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await appointmentService.rescheduleAppointment(req.params.id, req.body);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const cancel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await appointmentService.cancelAppointment(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};

export const availability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerId = req.query.providerId ? String(req.query.providerId) : "";
    const date = req.query.date ? String(req.query.date) : "";
    if (!providerId || !date) {
      return res.status(400).json({ message: "providerId and date are required" });
    }
    const r = await appointmentService.checkAvailability(providerId, date);
    res.json(r);
  } catch (e) {
    next(e);
  }
};
