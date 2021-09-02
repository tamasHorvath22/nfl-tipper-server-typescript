import 'reflect-metadata';
import { ConfigService } from './services/config.service';
import { connect } from 'mongoose';
import { useContainer, useExpressServer } from 'routing-controllers';
import Container from 'typedi';
import { Application } from "express";
import { UserController } from "./controllers/user.controller";
import { LeagueController } from "./controllers/league.controller";
import cors from "cors";
import { jwtTokenMiddleware } from "./middleware/jwt-token-middleware";
import bodyParser from "body-parser";
import express from 'express';
const PORT = process.env.PORT || 3000;

useContainer(Container);

export const app: Application = express();

app.use(cors());

app.use('/api', jwtTokenMiddleware);

app.use(bodyParser.json());

(() => {
  try {
    connect(ConfigService.getDbConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    } as any);
    console.log('connected to database');
  } catch (e) {
    console.log(e)
    console.log('database connection failed');
  }
})();

useExpressServer(app, {
  controllers: [
    UserController,
    LeagueController
  ]
});

app.listen(PORT, (): void => {
  console.log(`Server Running here https://localhost:${PORT}`);
});
