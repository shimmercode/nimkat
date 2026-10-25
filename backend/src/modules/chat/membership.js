const fail=(m,s=400)=>{throw Object.assign(new Error(m),{status:s});};
function membershipModule(app,{db,auth,requireRole,settings,events,now=Date.now}){
 const safe=fn=>(req,res,next)=>{try{fn(req,res);}catch(e){next(e);}},admin=[auth,requireRole('admin')];
 app.post('/api/admin/chat/rooms/:id/invitations/:uid/revoke',...admin,safe((req,res)=>{
  db.transaction(()=>{const i=db.prepare('SELECT * FROM chat_invitations WHERE room_id=? AND user_id=?').get(req.params.id,req.params.uid);if(!i)fail('دعوت پیدا نشد.',404);if(i.status==='revoked')return;if(i.status!=='pending')fail('دعوت قبلاً پاسخ داده شده است.',409);db.prepare("UPDATE chat_invitations SET status='revoked' WHERE room_id=? AND user_id=?").run(req.params.id,req.params.uid);settings.audit(req.user.id,'chat.invitation-revoked',req.params.id,{userId:Number(req.params.uid)});})();events.emit([Number(req.params.uid)],'chat.rooms',{});res.json({ok:true});
 }));
 function remove(roomId,uid,actor){
  const room=db.prepare('SELECT * FROM chat_rooms WHERE id=?').get(roomId),m=db.prepare('SELECT * FROM chat_members WHERE room_id=? AND user_id=?').get(roomId,uid);if(!room||!m)fail('عضویت پیدا نشد.',404);
  if(m.role==='moderator'&&db.prepare("SELECT COUNT(*) n FROM chat_members WHERE room_id=? AND role='moderator'").get(roomId).n<=1)fail('آخرین مدیر گفتگو را نمی‌توان حذف کرد.',409);
  if(actor!==uid&&room.kind==='class'){
   const classId=Number((room.source_key||'').split(':')[1]);if(db.prepare("SELECT 1 FROM bookings WHERE class_id=? AND user_id=? AND status='confirmed'").get(classId,uid))fail('عضو دارای رزرو قطعی باید از مسیر لغو/بازپرداخت تعیین تکلیف شود.',409);
  }
  db.prepare('DELETE FROM chat_members WHERE room_id=? AND user_id=?').run(roomId,uid);settings.audit(actor,'chat.member-removed',roomId,{userId:uid});
 }
 app.post('/api/admin/chat/rooms/:id/members/:uid/remove',...admin,safe((req,res)=>{db.transaction(()=>remove(req.params.id,Number(req.params.uid),req.user.id))();events.emit([Number(req.params.uid)],'chat.message',{roomId:req.params.id,deleted:true});events.emit([Number(req.params.uid)],'chat.rooms',{});res.json({ok:true});}));
 app.post('/api/chats/:id/leave',auth,safe((req,res)=>{db.transaction(()=>remove(req.params.id,req.user.id,req.user.id))();events.emit([req.user.id],'chat.rooms',{});res.json({ok:true});}));
}
module.exports={membershipModule};
