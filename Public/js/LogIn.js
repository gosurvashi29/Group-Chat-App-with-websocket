async function logIn(event) {
    try{
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    const logInDetails={
      
      email:email,
      password:password
    }
     
    console.log(logInDetails);
  
    const response= await axios.post("http://localhost:9000/user/login",logInDetails)

    if (response.status===200){
        alert(response.data.message)
        localStorage.setItem('token', response.data.token)
        console.log(response.data.isPremium)
        window.location.href="../views/chat"
    }
    else{
      alert(response.data.message)
        throw new Error(response.data.message)
    }
  
   
  }
  catch(err){
    if (err.response.status === 401) {
      alert("User not authorized!");}
    else if(err.response.status === 404) {
      alert("User does not exist!");
    }else
    {
    console.log(JSON.stringify(err))
    document.body.innerHTML +=`<div style="color:red">${err} </div>`;
    }
  }
  }