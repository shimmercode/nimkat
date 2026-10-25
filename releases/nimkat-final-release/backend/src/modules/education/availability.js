const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
function availabilityModule(app,{db,now=Date.now}){
 app.get('/api/teachers/:id/availability',(req,res,next)=>{try{
  res.set('Cache-Control','no-store');const tid=Number(req.params.id),week=Number(req.query.week||0),offset=Number(req.query.offset||0);if(!Number.isSafeInteger(tid)||tid<1||!Number.isSafeInteger(week)||week<0||week>12||!Number.isSafeInteger(offset)||offset<0||offset>10000)fail('مدرس، بازه یا صفحه نامعتبر است.');
  if(!db.prepare('SELECT id FROM teachers WHERE id=?').get(tid))fail('مدرس پیدا نشد.',404);
  const from=now()+week*7*86400000,to=from+7*86400000;
  const rows=db.prepare(`SELECT o.id,o.class_id,o.starts_at,o.ends_at,c.title,c.mode,c.price,
   MAX(0,c.capacity-COALESCE(c.taken,0)-(SELECT COUNT(*) FROM booking_seats bs JOIN bookings b ON b.id=bs.booking_id WHERE bs.class_id=c.id AND (b.status='confirmed' OR (b.status='held' AND b.hold_until>?)))) seatsLeft,
   EXISTS(SELECT 1 FROM schedule_proposals p WHERE p.occurrence_id=o.id AND p.status='pending' AND p.expires_at>?) rescheduling
   FROM class_occurrences o JOIN classes c ON c.id=o.class_id JOIN teacher_accounts a ON a.teacher_id=o.teacher_id AND a.status='approved'
   WHERE o.teacher_id=? AND o.status='scheduled' AND o.starts_at>=? AND o.starts_at<? ORDER BY o.starts_at,o.id LIMIT 51 OFFSET ?`).all(now(),now(),tid,from,to,offset);
  res.json({from,to,timezone:'Asia/Tehran',week,occurrences:rows.slice(0,50),hasMore:rows.length>50});
 }catch(e){next(e);}});
}
module.exports={availabilityModule};
