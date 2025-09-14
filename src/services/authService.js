import axios from "axios";
import Signup from "../Pages/Signup";
import Navbar from "../components/Navbar";

const API_URL = 'http://localhost:8080';
const api = axios.create({
    baseURL: API_URL,
    headers:{
        'Content-Type':'application/json'
    },
    withCredentials: true
});

// Responce interceptor for global error handling

api.interceptors.response.use(
    (response) => response,
    (error)=>{
        if(error.response){
            switch(error.response.status){
                case 401: 
                     authService.logout();
                     window.location.href="/login";
                     break;
                case 403:
                     console.error("Access forbidden");
                     break;
                case 404:
                    console.log("Resource not found");  
                    break;  
                case 500:
                    console.error("Internal Server Error")
                    break;    
            }
        }else if(error.request){
            console.error("Request made but didn't get the response "+error.request);
        }else{
            console.error("Something happen in the request "+error.message);
        }

        return Promise.reject(error);
    }
);

const generateUserColor=()=>{
    const colors = [
        '#FF6B6b','#4ECDC4','#45B701','#96CEB4','#FFEAA7',
        '#DDA0DD','#98D8C8','#F70C6F','#78FA48','#8BC1E9',
    ]
    return colors[Math.floor(Math.random() * colors.length)];
}

export const authService={
    login: async(username, password) =>{
        try {
            const response = await api.post('/auth/login',{
                username,
                password
            });
            
            const useColor = generateUserColor();
            const userData = {
                ...response.data,
                color:useColor,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('currentUser',JSON.stringify(userData));
            localStorage.setItem('user',JSON.stringify(response.data));

            return {
                success: true,
                user: userData
            };
        } catch (error) {
            console.error('Login failed ',error);
            const errorMessage = error.response?.data?.message || 'Login failed, Please Check your credentials';
            throw new errorMessage;
        }
    },

    signup: async(username, email, password)=>{
        try {
            const response = await api.post('/auth/signup',{
                username,
                email,
                password
            });

            return{
                success: true,
                user: response.data
            };
        } catch (error) {
            console.error('Signup failed ',error);
            const errorMessage = error.response?.data?.message || 'Signup failed, Please Check your credentials';
            throw new errorMessage;
        }
    },

    logout: async()=>{
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.log('Logout failed',error);
        }finally{
            localStorage.removeItem('currentUser');
            localStorage.removeItem('user');
        }
    },

    fetchCurrentuser: async()=>{
        try {
            const response = await api.get('/auth/getcurrentuser');

            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            console.error('Error fetching user data',error);
            if(error.response && error.response.status===401){
                await authService.logout();
            }
        }
    },

    getCurrentUser:()=>{
        const currentUserstr = localStorage.getItem('currentUser');
        const userStr = localStorage.getItem('user');

        try {
            if(currentUserstr){
                return JSON.parse(currentUserstr);
            }else if(userStr){
                const userData = JSON.parse(userStr);
                const useColor = generateUserColor();
                return{
                    ...userData,
                    color: useColor
                };
            }
            return null;
        } catch (error) {
          console.error("Error parsing user data from localStorage",error);
          return null;  
        }
    },

    isAuthenticated:() => {
        const user = localStorage.getItem('user') || localStorage.getItem('currentUser');
        return !!user;
    },

    fetchPrivateMessages: async(user1, user2)=>{
        try {
            const response = await api.get(`/api/messages/private?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
            return response.data;
        } catch (error) {
            console.error('Error in fetching priavte messages',error);
            throw error;
        }
    },

    getOnlineUsers: async()=>{
        try {
            const response = await api.get('/auth/getOnlineusers');
            return response.data;
        } catch (error) {
            console.error('Error in fetching online users',error);
            throw error;
        }
    }

} 
export default authService;

















// import axios from 'axios';

// const API_URL = 'http://localhost:8080';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   withCredentials: true,
// });

// // Response interceptor for error handling
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response) {
//       switch (error.response.status) {
//         case 401:
//           authService.logout();
//           window.location.href = '/login';
//           break;
//         case 403:
//           console.error('Access forbidden');
//           break;
//         case 404:
//           console.log('Resource not found');
//           break;
//         case 500:
//           console.error('Internal Server Error');
//           break;
//         default:
//           console.error('HTTP error', error.response.status);
//       }
//     } else if (error.request) {
//       console.error('Request made but no response', error.request);
//     } else {
//       console.error('Request error', error.message);
//     }

//     return Promise.reject(error);
//   }
// );

// // Utility to generate a random user color
// const generateUser Color = () => {
//   const colors = [
//     '#FF6B6b', '#4ECDC4', '#45B701', '#96CEB4', '#FFEAA7',
//     '#DDA0DD', '#98D8C8', '#F70C6F', '#78FA48', '#8BC1E9',
//   ];
//   return colors[Math.floor(Math.random() * colors.length)];
// };

// const authService = {
//   login: async (username, password) => {
//     try {
//       const response = await api.post('/auth/login', { username, password });

//       const userColor = generateUser Color();
//       const userData = {
//         ...response.data,
//         color: userColor,
//         loginTime: new Date().toISOString(),
//       };

//       localStorage.setItem('currentUser ', JSON.stringify(userData));
//       localStorage.setItem('user', JSON.stringify(response.data));

//       return {
//         success: true,
//         user: userData,
//       };
//     } catch (error) {
//       console.error('Login failed', error);
//       const errorMessage = error.response?.data?.message || 'Login failed, please check your credentials';
//       throw new Error(errorMessage);
//     }
//   },

//   signup: async (username, email, password) => {
//     try {
//       const response = await api.post('/auth/signup', { username, email, password });
//       return { success: true, user: response.data };
//     } catch (error) {
//       console.error('Signup failed', error);
//       const errorMessage = error.response?.data?.message || 'Signup failed, please check your credentials';
//       throw new Error(errorMessage);
//     }
//   },

//   logout: async () => {
//     try {
//       await api.post('/auth/logout');
//     } catch (error) {
//       console.log('Logout failed', error);
//     } finally {
//       localStorage.removeItem('currentUser ');
//       localStorage.removeItem('user');
//     }
//   },

//   fetchCurrent:User  async () => {
//     try {
//       const response = await api.get('/auth/getcurrentuser');
//       localStorage.setItem('user', JSON.stringify(response.data));
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching user data', error);
//       if (error.response && error.response.status === 401) {
//         await authService.logout();
//       }
//     }
//   },

//   getCurrent:User  () => {
//     const currentUser Str = localStorage.getItem('currentUser ');
//     const userStr = localStorage.getItem('user');

//     try {
//       if (currentUser Str) {
//         return JSON.parse(currentUser Str);
//       } else if (userStr) {
//         const userData = JSON.parse(userStr);
//         const userColor = generateUser Color();
//         return { ...userData, color: userColor };
//       }
//       return null;
//     } catch (error) {
//       console.error('Error parsing user data from localStorage', error);
//       return null;
//     }
//   },

//   isAuthenticated: () => {
//     const user = localStorage.getItem('user') || localStorage.getItem('currentUser ');
//     return !!user;
//   },

//   fetchPrivateMessages: async (user1, user2) => {
//     try {
//       const response = await api.get(
//         `/api/messages/private?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
//       );
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching private messages', error);
//       throw error;
//     }
//   },

//   getOnlineUsers: async () => {
//     try {
//       const response = await api.get('/auth/getOnlineusers');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching online users', error);
//       throw error;
//     }
//   },
// };

// export default authService;
