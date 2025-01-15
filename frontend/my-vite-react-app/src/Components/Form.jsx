import React, { useState } from 'react'
import axios from 'axios';


const Form = () => {
    const[formdata,setFormdata]=useState({
        name:'',
        email:'',
        age:'',
    })

    const handleSubmit = async () => {
        try {
          const response = await axios.post(
            "http://localhost:3000/api/users/newuser",
            formdata
          );
          if (response.status === 201) {
            alert("User created successfully");
          }
        } catch (err) {
          console.error("Error creating user:", err);
        }
      };

      
  return (
    <div>
        <div className=" font-semibold">
            Form
        </div>

        <div className="mt-2">
        <input type="text" value={formdata.name} onChange={(e)=>setFormdata({...formdata,name:e.target.value})} placeholder='Name' className='border border-[yellow]'/>
            <input type="text" value={formdata.email} onChange={(e)=>setFormdata({...formdata,email:e.target.value})} placeholder='email' className='border border-[yellow]'/>
            <input type="text" value={formdata.age} onChange={(e)=>setFormdata({...formdata,age:e.target.value})} placeholder='age' className='border border-[yellow]'/>
        </div>
        <div className=" mt-2">
            <button className='text-[black]  rounded-lg bg-[grey] ' onClick={handleSubmit}>Submit</button>
        </div>
    </div>
  )
}

export default Form