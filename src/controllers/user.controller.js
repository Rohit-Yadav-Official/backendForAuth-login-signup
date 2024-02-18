import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/usermodel.js';
import { uplokadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


const generateAccesssandRefreshtoken = async (user_id)=>{
    
      const user= await User.findById(user_id)
      const accessToken=user.generateAccessToken()
      const refreshToken= user.generateRefreshToken()
       user.refreshToken=refreshToken
       await user.save({ validateBeforeSave: false })
        return {accessToken,refreshToken}
    
} 


const registerUser = asyncHandler( async (req, res) => {
  


  const {fullName, email, username, password } = req.body
 
  if (
      [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
      throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
      $or: [{ username }, { email }]
  })

  if (existedUser) {
      throw new ApiError(409, "User with email or username already exists")
  }
  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;


  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
  }
  

  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uplokadOnCloudinary(avatarLocalPath)
  const coverImage = await uplokadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
  }
 

  const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email, 
      password,
      username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
  )

  if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully")
  )

} )
const loginUser =asyncHandler(async(req,res)=>{
  
    const {username,email,password}=req.body;

     if(!username && !email){
        throw new ApiError(400,"username is required")
     }
     const user=await User.findOne({
        $or:[{username,email}]
     })
     if(!user){
        throw new ApiError(400,"user does'nt exist")
     }
    const ispasswordcorrect=await user.isPasswordCorrect(password);
    if(!ispasswordcorrect){
        throw new ApiError(400," password is incorrect")
    }     
    const {accessToken,refreshToken} =await generateAccesssandRefreshtoken(user._id)
   const loggedInUser= User.findById(user._id).select("-password -refreshToken -coverImage -avatar")

   const option ={
    httpOnly : true,
    secure:true
   }
   //console.log(accessToken);
  // console.log(refreshToken);
       return res.status(200)
       .cookie("accessToken" , accessToken,option)
       .cookie("refreshToken" , refreshToken,option)
        .json(
        new ApiResponse(
            200, 
            {
                
               
               refreshToken,accessToken
            },
            "User logged In Successfully"
        )
        )



 

})
const logoutUser=asyncHandler(async(req,res)=>{
    try{
        await User.findByIdAndUpdate(req.user._id,{
            $unset:{
                refreshToken:1
            }
        },{
            new:true
        })
        const option ={
            httpOnly:true,
            secure:true
        }
       return res.status(200)
        .clearCookie("accesToken",option)
        .clearCookie("refreshToken",option)
        .json(new ApiResponse(200,{},"userLoggedout"))
    }
    catch(error){
        throw new ApiError(400,"something went wrong while logging out")
    }
})
export {registerUser,loginUser,logoutUser};