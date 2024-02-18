import express,  {urlencoded}  from"express"
const app= express()
import fileUpload from "express-fileupload"
import cookieParser from "cookie-parser"

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser())
import userRouter from './routes/user.router.js'
app.use("/api/v1/users",userRouter);

export {app}