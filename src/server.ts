import { Usercontroller } from './controllers/user-controller';
import cors from 'cors';
import { Application } from 'express';
import { createExpressServer } from 'routing-controllers';
import { jwtTokenMiddleware } from './middleware/jwt-token-middleware';
import bodyParser from 'body-parser';

export const app: Application = createExpressServer({
  controllers: [
    Usercontroller
  ]
});

app.use('/api', jwtTokenMiddleware);
app.use(bodyParser.json());

// TODO ???
// app.use(cors());
