const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  }
})

// Stopped here 26-09-2026 12:21 AM Saturday