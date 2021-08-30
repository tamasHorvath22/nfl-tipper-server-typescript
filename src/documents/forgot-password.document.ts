import { BaseDocument } from "./base.document";

export interface ForgotPasswordDocument extends BaseDocument {
  email: string
}
