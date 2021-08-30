import { BaseDocument } from "./base.document";

export interface EmailConfirmDocument extends BaseDocument {
  email: string,
  userId: string
}
