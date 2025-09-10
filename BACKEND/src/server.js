import express from "express"
import {ENV} from ".config/env.js"
const app=express();



app.get("/",(req,res)=>{
   res.send("hello world");
});

app.listen(ENV.PORT,()=>console.log(`SERVER STARTED  ON PORT ${ENV.PORT}`));