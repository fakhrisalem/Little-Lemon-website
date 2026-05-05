const ALL_TIMES=['11:00','11:30','12:00','12:30','13:00','13:30','14:00','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00'];

function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  const navEl=document.getElementById('nav-'+p);
  if(navEl)navEl.classList.add('active');
  window.scrollTo(0,0);
}

function seededRng(seed){
  let s=seed;
  return()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff;};
}
function dateToSeed(d){return d.split('').reduce((a,c)=>a+c.charCodeAt(0),0)*31;}

function getMinDate(){return new Date().toISOString().split('T')[0];}
function getMaxDate(){const d=new Date();d.setMonth(d.getMonth()+6);return d.toISOString().split('T')[0];}

function onDateChange(){
  const d=document.getElementById('date');
  const t=document.getElementById('time');
  const val=d.value;
  d.min=getMinDate();d.max=getMaxDate();
  t.innerHTML='<option value="">Loading times…</option>';
  t.disabled=true;
  setTimeout(()=>{
    if(!val){t.innerHTML='<option value="">Select a date first</option>';return;}
    const rng=seededRng(dateToSeed(val));
    const avail=ALL_TIMES.filter(()=>rng()>.35);
    const slots=avail.length>=2?avail:ALL_TIMES.slice(0,8);
    t.innerHTML='<option value="">— Select a time —</option>'+slots.map(s=>`<option value="${s}">${s}</option>`).join('');
    t.disabled=false;
    document.getElementById('time-hint').textContent=`${slots.length} slots available`;
    validateField('date');
  },400);
}

const VALIDATORS={
  date(v){
    if(!v)return'Please select a date.';
    const sel=new Date(v+'T00:00:00'),today=new Date(getMinDate()+'T00:00:00'),max=new Date(getMaxDate()+'T00:00:00');
    if(sel<today)return'Date must be today or in the future.';
    if(sel>max)return'Reservations up to 6 months in advance only.';
    return'';
  },
  time(v){return v?'':'Please select a time slot.';},
  guests(v){const n=Number(v);if(!v&&v!==0)return'Please enter guest count.';if(!Number.isInteger(n)||n<1)return'At least 1 guest required.';if(n>20)return'For 20+ guests, please call us.';return'';},
  occasion(v){return v?'':'Please select an occasion.';},
  name(v){if(!v||!v.trim())return'Please enter your full name.';if(v.trim().length<2)return'Name must be at least 2 characters.';return'';},
  email(v){if(!v||!v.trim())return'Please enter your email.';return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())?'':'Please enter a valid email.';},
  phone(v){if(!v||!v.trim())return'';return/^[\d\s\-+().]{7,20}$/.test(v.trim())?'':'Please enter a valid phone number.';},
};

function setFieldState(id,err){
  const el=document.getElementById(id);
  const errEl=document.getElementById(id+'-err');
  if(!el||!errEl)return;
  if(err){el.classList.add('err');el.setAttribute('aria-invalid','true');errEl.style.display='flex';errEl.textContent='⚠ '+err;}
  else{el.classList.remove('err');el.setAttribute('aria-invalid','false');errEl.style.display='none';}
}

function validateField(id){
  const el=document.getElementById(id);
  if(!el||!VALIDATORS[id])return true;
  const err=VALIDATORS[id](el.value);
  setFieldState(id,err);
  return!err;
}

function validateAll(){
  const fields=['date','time','guests','occasion','name','email','phone'];
  let valid=true;
  fields.forEach(f=>{if(!validateField(f))valid=false;});
  return valid;
}

function selectSeating(chip){
  document.querySelectorAll('.chip').forEach(c=>{c.classList.remove('sel');c.setAttribute('aria-checked','false');});
  chip.classList.add('sel');chip.setAttribute('aria-checked','true');
}
function chipKey(e,chip){if(e.key===' '||e.key==='Enter'){e.preventDefault();selectSeating(chip);}}

function updateCharCount(){
  const v=document.getElementById('special').value;
  document.getElementById('char-count').textContent=500-v.length;
}

function submitForm(e){
  e.preventDefault();
  if(!validateAll()){
    const firstErr=document.querySelector('[aria-invalid="true"]');
    if(firstErr)firstErr.focus();
    return;
  }
  const btn=document.getElementById('submit-btn');
  btn.disabled=true;
  btn.innerHTML='<span class="spinner" aria-hidden="true"></span>Confirming Reservation…';
  btn.setAttribute('aria-busy','true');
  const serverErr=document.getElementById('server-err');
  serverErr.style.display='none';

  setTimeout(()=>{
    const success=Math.random()>.05;
    if(success){
      const booking={
        date:document.getElementById('date').value,
        time:document.getElementById('time').value,
        guests:document.getElementById('guests').value,
        occasion:document.getElementById('occasion').value,
        seating:document.querySelector('.chip.sel')?.textContent||'Indoor',
        name:document.getElementById('name').value,
        email:document.getElementById('email').value,
        phone:document.getElementById('phone').value,
        special:document.getElementById('special').value,
      };
      showConfirmation(booking);
    }else{
      serverErr.style.display='block';
      serverErr.textContent='⚠ Booking failed. Please try a different time or date.';
      btn.disabled=false;
      btn.innerHTML='Reserve My Table';
      btn.setAttribute('aria-busy','false');
    }
  },700);
}

function formatDate(s){
  const[y,m,d]=s.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

function showConfirmation(b){
  document.getElementById('conf-num').textContent='LL-'+Date.now().toString(36).toUpperCase().slice(-6);
  document.getElementById('conf-email').textContent=b.email;
  const rows=[
    ['📅 Date',formatDate(b.date)],
    ['🕐 Time',b.time],
    ['👥 Guests',b.guests+' '+(b.guests=='1'?'person':'people')],
    ['🎉 Occasion',b.occasion],
    ['🪑 Seating',b.seating],
    ['👤 Name',b.name],
    ['✉️ Email',b.email],
    b.phone?['📞 Phone',b.phone]:null,
    b.special?['📝 Special Requests',b.special,'full']:null,
  ].filter(Boolean);
  document.getElementById('conf-details').innerHTML=rows.map(([dt,dd,cls])=>
    `<div class="det${cls?' '+cls:''}"><dt>${dt}</dt><dd>${dd}</dd></div>`
  ).join('');
  showPage('confirm');
}

function newReservation(){
  document.getElementById('booking-form').reset();
  document.getElementById('time').innerHTML='<option value="">Select a date first</option>';
  document.getElementById('time').disabled=true;
  document.getElementById('time-hint').textContent='Available slots load after selecting a date';
  document.getElementById('char-count').textContent='500';
  document.getElementById('server-err').style.display='none';
  document.querySelectorAll('.err-msg').forEach(e=>e.style.display='none');
  document.querySelectorAll('[aria-invalid]').forEach(e=>e.setAttribute('aria-invalid','false'));
  document.querySelectorAll('.err').forEach(e=>e.classList.remove('err'));
  document.getElementById('submit-btn').disabled=false;
  document.getElementById('submit-btn').innerHTML='Reserve My Table';
  document.getElementById('submit-btn').setAttribute('aria-busy','false');
  document.querySelectorAll('.chip').forEach((c,i)=>{c.classList.toggle('sel',i===0);c.setAttribute('aria-checked',i===0?'true':'false');});
  const d=document.getElementById('date');
  d.min=getMinDate();d.max=getMaxDate();
  showPage('booking');
}

document.getElementById('date').min=getMinDate();
document.getElementById('date').max=getMaxDate();