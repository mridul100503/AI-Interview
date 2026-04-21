import User from '../models/user_model.js';

export const getCurrentUser = async(req, res) => {
    try{
        const userId = req.userId;
         // Assuming the user is attached to the request object by authentication middleware
         const user=await User.findById(userId);
          // Exclude password from the response
          if(!user){
            return res.status(404).json({ message: 'User not found.' });
          }
          return res.status(200).json(user);
    }catch(error){
        res.status(500).json({ message:`failed to get currentUser ${error}` });
    }
}