import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectdb.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth_route.js';
import userRouter from './routes/user_route.js';
import cors from 'cors';
import interviewRouter from './routes/inter_route.js';
import paymentRouter from './routes/payment_route.js';

dotenv.config();

const app = express();

const PORT=process.env.PORT;

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}));

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/interview",interviewRouter)
app.use("/api/payment",paymentRouter)
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
