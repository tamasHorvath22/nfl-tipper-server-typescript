import 'reflect-metadata';
import { ConfigService } from './services/config.service';
import { app } from './server';
import { connect } from 'mongoose';
import { useContainer } from 'routing-controllers';
import Container from 'typedi';
const PORT = process.env.PORT || 8080;

useContainer(Container);

(async () => {
  try {
    await connect(ConfigService.getDbConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    } as any);
    console.log('connected to database');
  } catch (e) {
    console.log(e)
    console.log('database connection failed');
  }
})();

app.listen(PORT, (): void => {
  console.log(`Server Running here https://localhost:${PORT}`);
});
