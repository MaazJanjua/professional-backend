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

// routes imports
import userRouter from './routes/user.routes.js'
import productRouter from './routes/product.routes.js'
import cartRouter from './routes/cart.routes.js'
import orderRouter from './routes/order.routes.js'

// routes setup
app.use('/api/v1/users', userRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/cart', cartRouter)
app.use("/api/v1/order", orderRouter)

app.get('/', (req, res) => {
    res.send('Hello World!')
});

export default app;