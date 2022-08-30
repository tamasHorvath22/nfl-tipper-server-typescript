import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { ApiResponseMessage } from "../constants/api-response-message";
import dotenv from 'dotenv';
import { ConfigService, EnvKey } from '../services/config.service';
dotenv.config();

export const jwtTokenMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let token = req.headers['authorization'];
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);

    jwt.verify(token, ConfigService.getEnvValue(EnvKey.JWT_PRIVATE_KEY), (err, decoded) => {
      if (err) {
        res.send(ApiResponseMessage.USER_TOKEN_ERROR);
        return;
      } else {
        next();
      }
    });
  } else {
    res.send(ApiResponseMessage.USER_MISSING_TOKEN);
  }
}
