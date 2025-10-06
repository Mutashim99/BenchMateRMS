import { NextFunction,Request,Response } from "express";

export const errorHandler =  (err : any, req:Request,res:Response,next : NextFunction) : void => {
    console.log("Error Handler:", err);
    const {status,message} = err

    res.status(status || 500).json({
        success : false,
        message : message || "Something went wrong"
    })
}
