import {request as factory} from '@playwright/test';
// Reuse a valid development admin session within the worker instead of requesting
// a sixth OTP for one phone. Production rate limits must not be relaxed for tests.
let cached:{baseURL:string,state:any}|null=null;
export async function adminSession(baseURL:string){
 const api=await factory.newContext({baseURL,storageState:cached?.baseURL===baseURL?cached.state:undefined});
 let me=await(await api.get('/api/auth/me')).json();
 if(me.user?.role!=='admin'){
  const response=await api.post('/api/auth/otp/request',{data:{mobile:'09120000000'}}),otp=await response.json();
  if(!response.ok()||!otp.devCode){await api.dispose();throw Error(`Disposable development admin OTP unavailable (${response.status()})`);}
  const verified=await api.post('/api/auth/otp/verify',{data:{mobile:'09120000000',code:otp.devCode}});if(!verified.ok()){await api.dispose();throw Error('Development admin verification failed');}
  me=await(await api.get('/api/auth/me')).json();
 }
 if(me.user?.role!=='admin'){await api.dispose();throw Error('The test account is not an administrator');}
 const state=await api.storageState();cached={baseURL,state};return {api,cookies:state.cookies,headers:{'X-CSRF-Token':state.cookies.find(c=>c.name==='nk_csrf')!.value},user:me.user};
}
