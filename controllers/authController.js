const register = async (req, res, next) => {
  try {

    const {name,email,password,phone} = req.body

   
    

    res.status(201).json({
      success: true,
      message: "Successfully registered",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
};
