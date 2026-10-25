const fail=(m,s=400)=>{throw Object.assign(new Error(m),{status:s});};
function workflowModule(app,{db,auth,requireRole,settings,now=Date.now}){
 db.exec(`CREATE TABLE IF NOT EXISTS support_assignments(kind TEXT NOT NULL,thread_id TEXT NOT NULL,assignee_id INTEGER,version INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(kind,thread_id));
 CREATE TABLE IF NOT EXISTS support_agent_presence(user_id INTEGER PRIMARY KEY,last_seen INTEGER NOT NULL);`);
 const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(e){next(e);}},admin=[auth,requireRole('admin')];
 function thread(kind,id){if(!['member','guest'].includes(kind))fail('نوع درخواست معتبر نیست.');const row=db.prepare(`SELECT id,status,created_at FROM ${kind==='guest'?'support_guests':'support_threads'} WHERE id=?`).get(id);if(!row)fail('درخواست پیدا نشد.',404);return row;}
 function value(kind,id){const row=thread(kind,id),assignment=db.prepare('SELECT * FROM support_assignments WHERE kind=? AND thread_id=?').get(kind,id)||{kind,thread_id:id,assignee_id:null,version:0};
  const oldest=db.prepare("SELECT MIN(created_at) t FROM support_posts WHERE thread_id=? AND kind='user' AND id>COALESCE((SELECT MAX(id) FROM support_posts WHERE thread_id=? AND kind='agent'),0)").get(id,id).t;
  const waitingSince=['waiting','human'].includes(row.status)?oldest:null,deadline=waitingSince===null?null:waitingSince+settings.get('support').config.slaMinutes*60000;
  return {...assignment,status:row.status,waitingSince,deadline,overdue:deadline!==null&&deadline<now()};
 }
 app.post('/api/admin/support/heartbeat',...admin,safe((req,res)=>{db.prepare('INSERT INTO support_agent_presence VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET last_seen=excluded.last_seen').run(req.user.id,now());res.json({ok:true});}));
 app.get('/api/admin/support/workflow/:kind/:id',...admin,safe((req,res)=>res.json({workflow:value(req.params.kind,req.params.id),agents:db.prepare("SELECT u.id,u.name,p.last_seen FROM users u LEFT JOIN support_agent_presence p ON p.user_id=u.id WHERE u.role='admin' ORDER BY u.id LIMIT 200").all().map(a=>({...a,recentlyActive:!!a.last_seen&&a.last_seen>now()-70000})),slaMinutes:settings.get('support').config.slaMinutes,clock:now()})));
 app.post('/api/admin/support/workflow/:kind/:id/assign',...admin,safe((req,res)=>{
  const {assigneeId,version,note}=req.body||{};if(!Number.isSafeInteger(version)||assigneeId!==null&&!Number.isSafeInteger(assigneeId)||typeof note!=='string'||note.trim().length<10||note.length>1000)fail('نسخه، کارشناس و شرح ارجاع حداقل ۱۰ نویسه لازم است.');
  db.transaction(()=>{const current=value(req.params.kind,req.params.id);if(current.version!==version)fail('مسئول درخواست تغییر کرده؛ دوباره دریافت کنید.',409);if(assigneeId!==null&&!db.prepare("SELECT 1 FROM users WHERE id=? AND role='admin'").get(assigneeId))fail('حساب کارشناس مجاز پیدا نشد.');db.prepare('INSERT INTO support_assignments VALUES(?,?,?,?,?) ON CONFLICT(kind,thread_id) DO UPDATE SET assignee_id=excluded.assignee_id,version=excluded.version,updated_at=excluded.updated_at').run(req.params.kind,req.params.id,assigneeId,version+1,now());settings.audit(req.user.id,'support.assigned',req.params.id,{kind:req.params.kind,assigneeId,version:version+1,note:note.trim()});})();res.json({workflow:value(req.params.kind,req.params.id)});
 }));
}
module.exports={workflowModule};
