import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/config.js';

const app = express();

app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'))
app.use(cookieParser());

//routesv imports
import userRouter from './routes/user.routes.js'

app.use('/api/v1/users', userRouter)

app.get('/', (req, res) => {
    res.send('Hello World!')
});

export default app;