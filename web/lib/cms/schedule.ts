/** Convert a wall-clock entry in an IANA zone to UTC; reject DST gaps/ambiguity. */
export function scheduledUtc(input:string,timeZone:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input))throw new Error('Waktu tidak valid')
 const parts=new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
 const wall=(date:Date)=>parts.format(date).replace(' ','T')
 const target=new Date(`${input}:00Z`).getTime();let candidate=target
 for(let i=0;i<4;i++){const rendered=new Date(`${wall(new Date(candidate))}:00Z`).getTime();candidate+=target-rendered}
 if(wall(new Date(candidate))!==input)throw new Error('Waktu tidak tersedia di zona ini (perubahan DST)')
 if([-120,-60,60,120].some(minutes=>wall(new Date(candidate+minutes*60000))===input))throw new Error('Waktu ambigu saat perubahan DST. Pilih waktu lain.')
 return new Date(candidate).toISOString()
}
