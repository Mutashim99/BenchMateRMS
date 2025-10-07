import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;


export const generateToken =  (payload: {userId:string}) : string => {
  const token:string = jwt.sign(payload, JWT_SECRET, {expiresIn: '1d',});
  return token;
};


export const verifyToken = (token : string) : {userId:string} =>  {
  try{  
    return jwt.verify(token,JWT_SECRET) as {userId:string}
  }catch(e){
    throw new Error("Invalid token");
  }
}