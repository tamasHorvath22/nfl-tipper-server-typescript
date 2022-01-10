import { Document } from 'mongoose';

export interface BaseDocument extends Document {
  _id: string;
  __v: number;
  createdAt: Date;
  updatedAt: Date;
}
