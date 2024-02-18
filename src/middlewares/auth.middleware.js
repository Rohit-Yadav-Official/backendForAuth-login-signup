import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/usermodel.js";
export const verifyJWT = asyncHandler(async (req, _, next)=>{
  try{
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
   //console.log(req.cookies);
  if(!token){
    throw new ApiError(401, "error while verifing token");
   }

   const decoded= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
   const user=await User.findById(decoded?._id).select("-password -refreshToken");
   if(!user){
    throw new ApiError(402, "invalid user");
   }
   req.user=user;
   next();
  }
  catch(err){
    throw new ApiError(500,"something went wrong while verifing jwt")
  }
 })