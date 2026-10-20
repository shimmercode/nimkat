function panelModule(app,{db,auth,finance,club,now=Date.now}){
 const overview=(req,res)=>{const uid=req.user.id,a=club.account(uid),cfg=club.configuration(),teacher=db.prepare("SELECT teacher_id FROM teacher_accounts WHERE user_id=? AND status='approved'").get(uid);
  const upcoming=db.prepare(`SELECT DISTINCT o.id,o.starts_at,o.ends_at,c.title,t.name teacher_name FROM class_occurrences o JOIN classes c ON c.id=o.class_id JOIN teachers t ON t.id=o.teacher_id WHERE o.status='scheduled' AND o.ends_at>? AND (o.teacher_id=? OR EXISTS(SELECT 1 FROM booking_occurrences bo JOIN bookings b ON b.id=bo.booking_id WHERE bo.occurrence_id=o.id AND b.user_id=? AND b.status='confirmed' AND b.schema_version=2)) ORDER BY o.starts_at LIMIT 10`).all(now(),teacher?.teacher_id||-1,uid);
  const completed=db.prepare("SELECT COUNT(*) n FROM loyalty_events WHERE user_id=? AND kind='class.completed'").get(uid).n;
  res.json({user:{id:uid,name:req.user.name,role:req.user.role},wallet:finance.walletBalance(uid)/10,club:{coins:a.coins,points:a.points,level:[...cfg.levels].reverse().find(l=>a.points>=l.minPoints)?.name||''},teacherApproved:!!teacher,stats:{verifiedSessions:completed,upcomingShown:upcoming.length},upcoming,notifications:db.prepare('SELECT id,title,body,created_at FROM loyalty_notifications WHERE user_id=? ORDER BY id DESC LIMIT 30').all(uid),files:[],filesPreviewIncluded:false,filesStatus:'private_materials_route',filesUrl:req.user.role==='parent'?'/parent/files':req.user.role==='teacher'?'/teacher/files':'/panel/files'});
 };
 app.get('/api/panel/overview',auth,overview);
 return {overview};
}
module.exports={panelModule};
